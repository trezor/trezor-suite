export const getDisplayKey = (title: string, username: string) => {
    try {
        return `Unlock ${new URL(title).host} for user ${username}?`;
    } catch {
        return `Unlock ${title} for user ${username}?`;
    }
};

export const getNextId = (entries: Record<number, any>) => {
    if (Object.keys(entries).length === 0) return 0;

    return Number(Object.keys(entries).sort((a, b) => parseInt(b, 10) - parseInt(a, 10))[0]) + 1;
};
