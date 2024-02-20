import { Alice } from '../../src/client/Alice';

export const createInput = (
    accountKey: string,
    outpoint: string,
    options?: Record<string, any>,
) => {
    const input = new Alice(accountKey, options?.accountType || 'Taproot', {
        outpoint,
        address: 'bcrt1pl3y9gf7xk2ryvmav5ar66ra0d2hk7lhh9mmusx3qvn0n09kmaghq6gq9fy',
        scriptPubKey: '5120fc485427c6b286466faca747ad0faf6aaf6f7ef72ef7c81a2064df3796dbea2e',
        path: 'm/10025',
        amount: options?.amount || 1,
        anonymityLevel: 1,
    });
    if (options) {
        Object.keys(options).forEach(key => {
            // @ts-expect-error key-value unsolvable problem
            input[key] = options[key];
        });
    }

    return input;
};
