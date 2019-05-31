export const getApp = (url: string) => {
    if (url === '/' || url.indexOf('/wallet') === 0) return 'wallet';
    if (url.indexOf('/onboarding') === 0) return 'onboarding';

    return 'unknown';
};

export const getParams = (url: string) => {
    const split = url.split('#');
    if (!split[1]) return {};
    const parts = split[1].substr(1, split[1].length).split('/');

    const params: { [key: string]: string } = {};
    ['coin', 'accountId'].forEach((key, index) => {
        params[key] = parts[index];
    });
    return params;
};
