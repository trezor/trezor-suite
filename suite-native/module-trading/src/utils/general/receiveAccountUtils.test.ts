import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';

import { btc1NormalAccount, eth1NormalAccount } from '@suite-native/trading-fixtures';
import type { Address } from '@trezor/blockchain-link-types';

import { getReceiveAccountAddressText, isFullySelectedReceiveAccount } from './receiveAccountUtils';

const networkConfigDeps = mockNetworkConfigDeps();

describe('receiveAccountUtils', () => {
    describe('isFullySelectedReceiveAccount', () => {
        it('should be false when account is not specified', () => {
            expect(isFullySelectedReceiveAccount(networkConfigDeps, undefined)).toBe(false);
        });

        it('should be false when BTC like account is selected but no receive address is specified', () => {
            expect(
                isFullySelectedReceiveAccount(networkConfigDeps, { account: btc1NormalAccount }),
            ).toBe(false);
        });

        it('should be true when both account and address is selected', () => {
            const btcAccount = btc1NormalAccount;

            expect(
                isFullySelectedReceiveAccount(networkConfigDeps, {
                    account: btcAccount,
                    address: btcAccount.addresses!.used[0],
                }),
            ).toBe(true);
        });

        it('should be true when ETH like account is selected', () => {
            expect(
                isFullySelectedReceiveAccount(networkConfigDeps, { account: eth1NormalAccount }),
            ).toBe(true);
        });
    });

    describe('getReceiveAccountAddressText', () => {
        it('should return undefined when account is not specified', () => {
            expect(getReceiveAccountAddressText(networkConfigDeps, undefined)).toBeUndefined();
        });

        it('should return undefined when only account is specified for BTC', () => {
            expect(
                getReceiveAccountAddressText(networkConfigDeps, {
                    account: btc1NormalAccount,
                }),
            ).toBeUndefined();
        });

        it('should return selected address', () => {
            const btcAccount = btc1NormalAccount;

            expect(
                getReceiveAccountAddressText(networkConfigDeps, {
                    account: btcAccount,
                    address: btcAccount.addresses!.used[0],
                }),
            ).toBe('USED1');
        });

        it('should return descriptor when ETH account is specified', () => {
            expect(
                getReceiveAccountAddressText(networkConfigDeps, {
                    account: eth1NormalAccount,
                }),
            ).toBe('eth1normal');
        });

        it('should ignore specified address for ETH', () => {
            expect(
                getReceiveAccountAddressText(networkConfigDeps, {
                    account: eth1NormalAccount,
                    address: { address: 'should_be_ignored' } as Address,
                }),
            ).toBe('eth1normal');
        });
    });
});
