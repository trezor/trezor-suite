import { createHash, createHmac, randomBytes } from 'crypto';

const TRADE_API_INSTALL_SALT_BYTES = 32;

export type CreateSaltedTradeApiKeyParams = {
    salt: string;
    descriptor: string;
};

export const deriveTradeApiDeviceSalt = (cipheredValue: string) =>
    createHash('sha256').update(Buffer.from(cipheredValue, 'hex')).digest('hex');

export const generateTradeApiInstallSalt = () =>
    randomBytes(TRADE_API_INSTALL_SALT_BYTES).toString('hex');

export const createSaltedTradeApiKey = ({ salt, descriptor }: CreateSaltedTradeApiKeyParams) =>
    createHmac('sha256', Buffer.from(salt, 'hex')).update(descriptor).digest('hex');
