import { type UnavailableCapability } from '@trezor/connect';

import { type Account } from 'src/types/wallet';

import { verifyAvailability } from './verifyAvailability';

const getMockAccount = (account: Partial<Account> = {}): Account =>
    ({
        networkType: 'bitcoin',
        index: 0,
        empty: false,
        visible: true,
        accountType: 'normal',
        ...account,
    }) as Account;

const usedAccount = getMockAccount({ index: 0 });
const hiddenEmptyAccount = getMockAccount({ index: 1, empty: true, visible: false });

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
                    scopedAccounts: [usedAccount, hiddenEmptyAccount],
                    unavailableCapability: capability,
                }),
            ).toBe(expected);
        });

        it('takes precedence over the account checks', () => {
            expect(
                verifyAvailability({ scopedAccounts: [], unavailableCapability: 'no-support' }),
            ).toBe('TR_ACCOUNT_TYPE_NO_SUPPORT');
        });
    });

    it('returns NO_ACCOUNT when there is no account and the capability is available', () => {
        expect(verifyAvailability({ scopedAccounts: [] })).toBe('MODAL_ADD_ACCOUNT_NO_ACCOUNT');
    });

    describe('non-ethereum networks', () => {
        it('allows adding the last hidden empty account when no other account is empty', () => {
            expect(
                verifyAvailability({ scopedAccounts: [usedAccount, hiddenEmptyAccount] }),
            ).toBeUndefined();
        });

        it('allows adding the only account when it is hidden and empty', () => {
            expect(
                verifyAvailability({
                    scopedAccounts: [
                        getMockAccount({ accountType: 'taproot', empty: true, visible: false }),
                    ],
                }),
            ).toBeUndefined();
        });

        it('returns NO_EMPTY_ACCOUNT when the last account is already visible', () => {
            expect(
                verifyAvailability({
                    scopedAccounts: [usedAccount, getMockAccount({ index: 1, empty: true })],
                }),
            ).toBe('MODAL_ADD_ACCOUNT_NO_EMPTY_ACCOUNT');
        });

        it('returns NO_EMPTY_ACCOUNT when the last account is used', () => {
            expect(verifyAvailability({ scopedAccounts: [usedAccount] })).toBe(
                'MODAL_ADD_ACCOUNT_NO_EMPTY_ACCOUNT',
            );
        });

        it('returns PREVIOUS_EMPTY when another account is empty', () => {
            expect(
                verifyAvailability({
                    scopedAccounts: [
                        getMockAccount({ index: 0, empty: true }),
                        getMockAccount({ index: 1 }),
                        getMockAccount({ index: 2, empty: true, visible: false }),
                    ],
                }),
            ).toBe('MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY');
        });
    });

    it('allows adding an ethereum account after empty ones', () => {
        expect(
            verifyAvailability({
                scopedAccounts: [
                    getMockAccount({ networkType: 'ethereum', index: 0, empty: true }),
                    getMockAccount({ networkType: 'ethereum', index: 1, empty: true }),
                ],
            }),
        ).toBeUndefined();
    });
});
