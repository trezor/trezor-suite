export const resolveAfter = (msec: number, value?: any) =>
    new Promise<any>(resolve => {
        setTimeout(resolve, msec, value);
    });
