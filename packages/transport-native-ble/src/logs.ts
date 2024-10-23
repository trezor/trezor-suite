export const logs: string[] = [];

// This is for debug purposes it should be removed once BT goes to production
export const log = (message: string) => {
    logs.push(message);
};
