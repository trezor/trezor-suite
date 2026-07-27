import { type UnavailableCapability } from '@trezor/connect';

import { type Account } from 'src/types/wallet';

import { verifyAvailability } from './verifyAvailability';

const getMockAccount = (account: Partial<Account> = {}): Account =>
    ({
        networkType: 'bitcoin',
        index: 0,
        empty: false,
        accountType: 'normal',
        ...account,
    }) as Account;

describe('verifyAvailability', () => {
    describe('unavailable capability', () => {
        const cases: [UnavailableCapability, string][] = [
            ['no-support', 'TR_ACCOUNT_TYPE_NO_SUPPORT'],
            ['update-required', 'TR_ACCOUNT_TYPE_UPDATE_REQUIRED'],
            ['trezor-connect-outdated', 'FW_CAPABILITY_CONNECT_OUTDATED'],
            ['no-capability', 'TR_ACCOUNT_TYPE_NO_CAPABILITY'],
        ];

        it.each(cases)('returns the matching message for "%s"', (capability, expected) => {
            expect(
                verifyAvailability({
                    emptyAccounts: [],
                    account: getMockAccount(),
                    unavailableCapability: capability,
                }),
            ).toBe(expected);
        });

        it('takes precedence over the account checks', () => {
            expect(
                verifyAvailability({
                    emptyAccounts: [],
                    account: undefined,
                    unavailableCapability: 'no-support',
                }),
            ).toBe('TR_ACCOUNT_TYPE_NO_SUPPORT');
        });
    });

    it('returns NO_ACCOUNT when no account is provided and the capability is available', () => {
        expect(
            verifyAvailability({
                emptyAccounts: [],
                account: undefined,
                unavailableCapability: undefined,
            }),
        ).toBe('MODAL_ADD_ACCOUNT_NO_ACCOUNT');
    });

    describe('non-ethereum networks', () => {
        it('returns NO_EMPTY_ACCOUNT when there are no empty accounts', () => {
            expect(
                verifyAvailability({
                    emptyAccounts: [],
                    account: getMockAccount({ index: 1 }),
                }),
            ).toBe('MODAL_ADD_ACCOUNT_NO_EMPTY_ACCOUNT');
        });

        it('returns PREVIOUS_EMPTY when more than one empty account exists', () => {
            expect(
                verifyAvailability({
                    emptyAccounts: [getMockAccount(), getMockAccount()],
                    account: getMockAccount({ index: 1 }),
                }),
            ).toBe('MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY');
        });

        it('returns PREVIOUS_EMPTY when the first normal account is itself empty', () => {
            expect(
                verifyAvailability({
                    emptyAccounts: [getMockAccount()],
                    account: getMockAccount({ index: 0, empty: true, accountType: 'normal' }),
                }),
            ).toBe('MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY');
        });

        it('returns undefined when exactly one empty account exists and the account can be added', () => {
            expect(
                verifyAvailability({
                    emptyAccounts: [getMockAccount()],
                    account: getMockAccount({ index: 1, empty: false }),
                }),
            ).toBeUndefined();
        });
    });

    it('skips the empty-account checks for ethereum networks', () => {
        expect(
            verifyAvailability({
                emptyAccounts: [],
                account: getMockAccount({ networkType: 'ethereum' }),
            }),
        ).toBeUndefined();
    });
});
