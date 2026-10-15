import { type BankAccount } from 'invity-api';

import { act, renderHook } from '@suite-common/test-utils';
import { mockBankAccount } from '@suite-common/trading/mocks';

import { useTradingSellBankAccountSelection } from './useTradingSellBankAccountSelection';

const UNVERIFIED = mockBankAccount({ bankAccount: 'LT1', verified: false });
const VERIFIED = mockBankAccount({ bankAccount: 'LT2' });
const OTHER_VERIFIED = mockBankAccount({ bankAccount: 'LT3' });

describe('useTradingSellBankAccountSelection', () => {
    it('preselects the first verified bank account', () => {
        const { result } = renderHook(() =>
            useTradingSellBankAccountSelection([UNVERIFIED, VERIFIED, OTHER_VERIFIED], undefined),
        );

        expect(result.current.selectedBankAccount).toBe(VERIFIED);
    });

    it('selects nothing when no bank account is verified', () => {
        const { result } = renderHook(() =>
            useTradingSellBankAccountSelection([UNVERIFIED], undefined),
        );

        expect(result.current.selectedBankAccount).toBeUndefined();
    });

    it('keeps the account the user picked', () => {
        const { result } = renderHook(() =>
            useTradingSellBankAccountSelection([VERIFIED, OTHER_VERIFIED], undefined),
        );

        act(() => result.current.selectBankAccount(OTHER_VERIFIED));

        expect(result.current.selectedBankAccount).toBe(OTHER_VERIFIED);
    });

    it('drops the picked account once the partner no longer lists it', () => {
        const { result, rerender } = renderHook(
            (bankAccounts: BankAccount[]) =>
                useTradingSellBankAccountSelection(bankAccounts, undefined),
            { initialProps: [VERIFIED, OTHER_VERIFIED] },
        );

        act(() => result.current.selectBankAccount(OTHER_VERIFIED));
        rerender([VERIFIED]);

        expect(result.current.selectedBankAccount).toBe(VERIFIED);
    });

    it('shows the bank account confirmed for the trade instead of the first verified one', () => {
        const { result } = renderHook(() =>
            useTradingSellBankAccountSelection([VERIFIED, OTHER_VERIFIED], OTHER_VERIFIED),
        );

        expect(result.current.selectedBankAccount).toBe(OTHER_VERIFIED);
    });

    it('shows the confirmed bank account when the trade has no bank account list', () => {
        const { result } = renderHook(() =>
            useTradingSellBankAccountSelection(undefined, OTHER_VERIFIED),
        );

        expect(result.current.selectedBankAccount).toBe(OTHER_VERIFIED);
    });
});
