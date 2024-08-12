import { error } from './shared';

export const MAGIC = '3f232300';

export const MESSAGES = {
    PING: '01',
    SUCCESS: '02',
    INITIALIZE: '00',
    FEATURES: '11',
} as const;

export const buildMessage = (message: keyof typeof MESSAGES) => {
    return Buffer.from(MAGIC + MESSAGES[message], 'hex');
};

export const assertMessage = (message: Buffer, expected: keyof typeof MESSAGES) => {
    const assertedChunk = message.toString('hex').substring(0, MAGIC.length + 2);
    if (assertedChunk !== `${MAGIC}${MESSAGES[expected]}`) {
        throw new Error(error(`Expected message ${expected} but got ${assertedChunk}`));
    }
};
export function assertSuccess(result: any): asserts result is { success: true; payload: any } {
    if (!result.success) {
        throw new Error(error(result.error));
    }
}
export const assertEquals = (a: any, b: any) => {
    const strA = JSON.stringify(a);
    const strB = JSON.stringify(b);
    if (strA !== strB) {
        throw new Error(error(`Expected ${strA} to be equal to ${strB}`));
    }
};
