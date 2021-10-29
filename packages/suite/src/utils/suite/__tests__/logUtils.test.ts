import {
    redactAccount,
    redactDevice,
    redactTransaction,
    REDACTED_REPLACEMENT,
} from '@suite-utils/logUtils';

describe('logUtils', () => {
    const acc = global.JestMocks.getWalletAccount({
        deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        descriptor:
            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
        symbol: 'btc',
    });
    const dev = global.JestMocks.getSuiteDevice();
    const tx = global.JestMocks.getWalletTransaction({});

    describe('redactAccount', () => {
        it('should redact sensitive fields on account', () => {
            expect(redactAccount(acc)).toEqual({
                ...acc,
                descriptor: REDACTED_REPLACEMENT,
                addresses: REDACTED_REPLACEMENT,
                balance: REDACTED_REPLACEMENT,
                availableBalance: REDACTED_REPLACEMENT,
                formattedBalance: REDACTED_REPLACEMENT,
                history: {
                    ...acc.history,
                    transactions: REDACTED_REPLACEMENT,
                },
            });
        });
        it('should redact sensitive fields on device', () => {
            expect(redactDevice(dev)).toEqual({
                ...dev,
                id: REDACTED_REPLACEMENT,
                label: REDACTED_REPLACEMENT,
                features: {
                    ...dev.features,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    device_id: REDACTED_REPLACEMENT,
                    label: REDACTED_REPLACEMENT,
                },
            });
        });
        it('should redact sensitive fields on transaction', () => {
            expect(redactTransaction(tx)).toEqual({
                ...tx,
                amount: REDACTED_REPLACEMENT,
                txid: REDACTED_REPLACEMENT,
                targets: tx.targets.map(t => ({
                    ...t,
                    amount: REDACTED_REPLACEMENT,
                    addresses: t.addresses?.map(_a => REDACTED_REPLACEMENT),
                })),
                details: undefined,
            });
        });
    });
});
