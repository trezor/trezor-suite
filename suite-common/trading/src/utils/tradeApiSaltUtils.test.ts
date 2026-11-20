import { generateTradeApiInstallSalt } from './tradeApiSaltUtils';

describe('tradeApiSaltUtils', () => {
    it('generates a 32-byte hex install salt that differs on every call', () => {
        const salt = generateTradeApiInstallSalt();

        expect(salt).toMatch(/^[0-9a-f]{64}$/);
        expect(generateTradeApiInstallSalt()).not.toBe(salt);
    });
});
