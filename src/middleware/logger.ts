import { Request, Response, NextFunction } from 'express';

export function logger() {
    return (req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();

        console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Started`);

        res.on('finish', () => {
            const duration = Date.now() - start;
            const status = res.statusCode;
            const statusColor = status >= 500 ? '\x1b[31m' : // red
                status >= 400 ? '\x1b[33m' : // yellow
                    status >= 300 ? '\x1b[36m' : // cyan
                        status >= 200 ? '\x1b[32m' : // green
                            '\x1b[0m'; // reset

            console.log(
                `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ` +
                `${statusColor}${status}\x1b[0m - ${duration}ms`
            );
        });

        next();
    };
}
