import { redactAccount, redactDevice, REDACTED_REPLACEMENT } from '@suite-utils/logUtils';

describe('logUtils', () => {
    const acc = global.JestMocks.getWalletAccount({
        deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        descriptor:
            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
        symbol: 'btc',
    });
    const dev = global.JestMocks.getSuiteDevice();

    describe('redactAccount', () => {
        it('should redact sensitive fields on account', () => {
            expect(redactAccount(acc)).toEqual({
                ...acc,
                descriptor: REDACTED_REPLACEMENT,
                addresses: REDACTED_REPLACEMENT,
                balance: REDACTED_REPLACEMENT,
                availableBalance: REDACTED_REPLACEMENT,
                formattedBalance: REDACTED_REPLACEMENT,
                history: REDACTED_REPLACEMENT,
                deviceState: REDACTED_REPLACEMENT,
                utxo: REDACTED_REPLACEMENT,
                metadata: REDACTED_REPLACEMENT,
                key: REDACTED_REPLACEMENT,
            });
        });
        it('should redact sensitive fields on device', () => {
            expect(redactDevice(dev)).toEqual({
                ...dev,
                id: REDACTED_REPLACEMENT,
                label: REDACTED_REPLACEMENT,
                firmwareRelease: REDACTED_REPLACEMENT,
                state: REDACTED_REPLACEMENT,
                features: {
                    ...dev.features,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    device_id: REDACTED_REPLACEMENT,
                    label: REDACTED_REPLACEMENT,
                },
            });
        });
    });
});
