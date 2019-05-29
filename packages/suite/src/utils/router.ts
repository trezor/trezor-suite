export const isWallet = (url: string) => {
    if (!url) return false;
    return url === '/' || url.indexOf('/wallet') === 0;
}

export const isOnboarding = (url: string) => {
    return url.indexOf('/onboarding') === 0;
}

export const parseParams = (url: string) => {
    const [ pathname, hash ] = url.split('#');
    if (!hash) return {};
    const parts = hash.substr(1, hash.length).split('/');
    console.log(parts)

    const params: {[key: string]: string} = {};
    ['coin', 'accountId'].map((key, index) => {
        params[key] = parts[index];
    });
    return params;
}