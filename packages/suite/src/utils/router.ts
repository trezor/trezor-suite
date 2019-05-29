export const isWallet = (url: string) => {
    if (!url) return false;
    return url === '/' || url.indexOf('/wallet') === 0;
};

export const isOnboarding = (url: string) => {
    return url.indexOf('/onboarding') === 0;
};

export const parseParams = (url: string) => {
    const [pathname, hash] = url.split('#');
    if (!hash) return {};
    const parts = hash.substr(1, hash.length).split('/');

    const params: { [key: string]: string } = {};
    ['coin', 'accountId'].forEach((key, index) => {
        params[key] = parts[index];
    });
    return params;
};
