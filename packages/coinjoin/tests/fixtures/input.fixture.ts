import { Alice } from '../../src/client/Alice';

export const createInput = (
    accountKey: string,
    outpoint: string,
    options?: Record<string, any>,
) => {
    const input = new Alice(accountKey, options?.accountType || 'Taproot', {
        outpoint,
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
