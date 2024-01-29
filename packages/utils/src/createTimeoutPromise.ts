export const createTimeoutPromise = (timeout: number) =>
    new Promise(resolve => {
        setTimeout(resolve, timeout);
    });
