import { z } from 'zod';


export const GetFileQuerySchema =  z.object({
    name: z.string().optional().transform(val => val || null),
    size: z.string().transform(Number).pipe(z.number().min(1).max(100)).default(10),
    from: z.string().transform(Number).pipe(z.number().min(1)).default(1)
})

export type FileFilter = z.infer<typeof GetFileQuerySchema>;