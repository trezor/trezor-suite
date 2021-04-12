// todo: rework to something cryptographically stronger, probably use random bytes from crypto node module?
export const getRandomId = (length: number) => {
    let id = '';
    const list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        id += list.charAt(Math.floor(Math.random() * list.length));
    }
    return id;
};

export const getAnalyticsRandomId = () => getRandomId(10);

/**
 * Generate code_challenge for Oauth2
 * Authorization code with PKCE flow
 */
export const getCodeChallenge = () => getRandomId(128);

export const getRandomNumberInRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
