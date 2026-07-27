import { getRandomString } from '@trezor/utils';

export type GenerateSessionId = () => string;

export type GenerateSessionIdDep = {
    generateSessionId: GenerateSessionId;
};

const HEX_ALPHABET = '0123456789abcdef';

export const generateSessionId = (): string => getRandomString(32, HEX_ALPHABET);
