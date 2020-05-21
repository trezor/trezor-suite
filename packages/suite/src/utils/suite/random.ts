export const getRandomId = (length: number) => {
    let id = '';
    const list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        id += list.charAt(Math.floor(Math.random() * list.length));
    }
    return id;
};

export const getAnalyticsRandomId = () => {
    return getRandomId(10);
};
