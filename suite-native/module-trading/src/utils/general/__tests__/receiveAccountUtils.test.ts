import { btc1NormalAccount, eth1NormalAccount } from '@suite-native/trading-fixtures';
import type { Address } from '@trezor/blockchain-link-types';

import {
    getReceiveAccountAddressText,
    isFullySelectedReceiveAccount,
} from '../receiveAccountUtils';

describe('receiveAccountUtils', () => {
    describe('isFullySelectedReceiveAccount', () => {
        it('should be false when account is not specified', () => {
            expect(isFullySelectedReceiveAccount(undefined)).toBe(false);
        });

        it('should be false when BTC like account is selected but no receive address is specified', () => {
            expect(isFullySelectedReceiveAccount({ account: btc1NormalAccount })).toBe(false);
        });

        it('should be true when both account and address is selected', () => {
            const btcAccount = btc1NormalAccount;

            expect(
                isFullySelectedReceiveAccount({
                    account: btcAccount,
                    address: btcAccount.addresses!.used[0],
                }),
            ).toBe(true);
        });

        it('should be true when ETH like account is selected', () => {
            expect(isFullySelectedReceiveAccount({ account: eth1NormalAccount })).toBe(true);
        });
    });

    describe('getReceiveAccountAddressText', () => {
        it('should return undefined when account is not specified', () => {
            expect(getReceiveAccountAddressText(undefined)).toBeUndefined();
        });

        it('should return undefined when only account is specified for BTC', () => {
            expect(
                getReceiveAccountAddressText({
                    account: btc1NormalAccount,
                }),
            ).toBeUndefined();
        });

        it('should return selected address', () => {
            const btcAccount = btc1NormalAccount;

            expect(
                getReceiveAccountAddressText({
                    account: btcAccount,
                    address: btcAccount.addresses!.used[0],
                }),
            ).toBe('USED1');
        });

        it('should return descriptor when ETH account is specified', () => {
            expect(
                getReceiveAccountAddressText({
                    account: eth1NormalAccount,
                }),
            ).toBe('eth1-normal');
        });

        it('should ignore specified address for ETH', () => {
            expect(
                getReceiveAccountAddressText({
                    account: eth1NormalAccount,
                    address: { address: 'should_be_ignored' } as Address,
                }),
            ).toBe('eth1-normal');
        });
    });
});
