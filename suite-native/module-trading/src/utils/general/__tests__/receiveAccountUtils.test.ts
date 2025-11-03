import type { Address } from '@trezor/blockchain-link-types';

import { getBtcAccount, getEthAccount } from '../../../__fixtures__/account';
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
            expect(isFullySelectedReceiveAccount({ account: getBtcAccount() })).toBe(false);
        });

        it('should be true when both account and address is selected', () => {
            const btcAccount = getBtcAccount();

            expect(
                isFullySelectedReceiveAccount({
                    account: btcAccount,
                    address: btcAccount.addresses!.used[0],
                }),
            ).toBe(true);
        });

        it('should be true when ETH like account is selected', () => {
            expect(isFullySelectedReceiveAccount({ account: getEthAccount() })).toBe(true);
        });
    });

    describe('getReceiveAccountAddressText', () => {
        it('should return undefined when account is not specified', () => {
            expect(getReceiveAccountAddressText(undefined)).toBeUndefined();
        });

        it('should return undefined when only account is specified for BTC', () => {
            expect(
                getReceiveAccountAddressText({
                    account: getBtcAccount(),
                }),
            ).toBeUndefined();
        });

        it('should return selected address', () => {
            const btcAccount = getBtcAccount();

            expect(
                getReceiveAccountAddressText({
                    account: btcAccount,
                    address: btcAccount.addresses!.used[0],
                }),
            ).toBe('1BTC');
        });

        it('should return descriptor when ETH account is specified', () => {
            expect(
                getReceiveAccountAddressText({
                    account: getEthAccount(),
                }),
            ).toBe('descriptor-eth-account-1');
        });

        it('should ignore specified address for ETH', () => {
            expect(
                getReceiveAccountAddressText({
                    account: getEthAccount(),
                    address: { address: 'should_be_ignored' } as Address,
                }),
            ).toBe('descriptor-eth-account-1');
        });
    });
});
