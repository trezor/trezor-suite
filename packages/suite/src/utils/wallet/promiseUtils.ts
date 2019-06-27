export const resolveAfter = (msec: number, ...params: any[]): Promise<any> =>
    new Promise(resolve => {
        setTimeout(resolve, msec, ...params);
    });
