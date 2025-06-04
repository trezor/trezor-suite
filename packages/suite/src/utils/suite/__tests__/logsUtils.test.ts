import { testMocks } from '@suite-common/test-utils';

import { REDACTED_REPLACEMENT, redactAccount, redactDevice } from 'src/utils/suite/logsUtils';

describe('logsUtils', () => {
    const account = testMocks.getWalletAccount({
        deviceState: '1stTestnetAddress@device_id:0',
        descriptor:
            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
        symbol: 'btc',
    });
    const device = testMocks.getSuiteDevice();

    describe('redactAccount', () => {
        it('should redact sensitive fields on account', () => {
            expect(redactAccount(account)).toEqual({
                ...account,
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
    });

    describe('redactDevice', () => {
        it('should redact sensitive fields on device', () => {
            expect(redactDevice(device)).toEqual({
                ...device,
                id: REDACTED_REPLACEMENT,
                label: REDACTED_REPLACEMENT,
                firmwareRelease: REDACTED_REPLACEMENT,
                state: REDACTED_REPLACEMENT,
                metadata: REDACTED_REPLACEMENT,
                features: {
                    ...device.features,
                    device_id: REDACTED_REPLACEMENT,
                    session_id: REDACTED_REPLACEMENT,
                    label: REDACTED_REPLACEMENT,
                },
            });
        });
    });
});
