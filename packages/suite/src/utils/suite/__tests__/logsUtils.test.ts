import { testMocks } from '@suite-common/test-utils';
import { discoveryActions } from '@suite-common/wallet-core';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

import {
    redactAccount,
    redactAction,
    redactDevice,
    redactDiscovery,
    REDACTED_REPLACEMENT,
} from 'src/utils/suite/logsUtils';

describe('logsUtils', () => {
    const account = testMocks.getWalletAccount({
        deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        descriptor:
            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
        symbol: 'btc',
    });
    const device = testMocks.getSuiteDevice();
    const discovery = {
        deviceState: 'n3G5TV6d5D8nMjWTDUdjLmyFv5LtycJxT6@1945380BFC121301C978931C:1',
        status: DiscoveryStatus.COMPLETED,
    };

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

    describe('redactDiscovery', () => {
        it('should redact sensitive fields from discovery', () => {
            expect(redactDiscovery(discovery)).toEqual({
                ...discovery,
                deviceState: REDACTED_REPLACEMENT,
            });
        });
    });

    describe('redactAction', () => {
        it('should redact sensitive fields from discovery', () => {
            expect(
                redactAction({
                    datetime: 'Fri, 01 Jul 2022 10:07:17 GMT',
                    type: discoveryActions.completeDiscovery.type,
                    payload: discovery,
                }),
            ).toEqual({
                datetime: 'Fri, 01 Jul 2022 10:07:17 GMT',
                type: discoveryActions.completeDiscovery.type,
                payload: { ...discovery, deviceState: REDACTED_REPLACEMENT },
            });
        });
    });
});
