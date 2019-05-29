export const isWallet = (url: string) => {
    if (!url) return false;
    return url === '/' || url.indexOf('/wallet') === 0;
};

export const isOnboarding = (url: string) => {
    return url.indexOf('/onboarding') === 0;
};

export const parseParams = (url: string) => {
    const split = url.split('#');
    if (!split[1]) return {};
    const parts = split[1].substr(1, split[1].length).split('/');

    const params: { [key: string]: string } = {};
    ['coin', 'accountId'].forEach((key, index) => {
        params[key] = parts[index];
    });
    return params;
};
