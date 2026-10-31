import { deriveTradeApiDeviceSalt, generateTradeApiInstallSalt } from './tradeApiSaltUtils';

describe('tradeApiSaltUtils', () => {
    it('derives the device salt as sha256 of the ciphered bytes', () => {
        expect(deriveTradeApiDeviceSalt('ab'.repeat(32))).toBe(
            '9a2db2e23f1504cd056606553ac049c5e718e8f9ce9233876df1a7a1821af885',
        );
    });

    it('generates a 32-byte hex install salt that differs on every call', () => {
        const salt = generateTradeApiInstallSalt();

        expect(salt).toMatch(/^[0-9a-f]{64}$/);
        expect(generateTradeApiInstallSalt()).not.toBe(salt);
    });
});
