import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useSellBankAccountVerificationOnMount } from './useSellBankAccountVerificationOnMount';

describe('useSellBankAccountVerificationOnMount', () => {
    it('checks bank account verification only on mount', () => {
        const doBankAccountVerificationCheck = jest.fn();
        const { rerender } = renderHookWithBasicProvider(
            () =>
                useSellBankAccountVerificationOnMount({
                    doBankAccountVerificationCheck,
                }),
            { initialProps: {} },
        );

        rerender({});

        expect(doBankAccountVerificationCheck).toHaveBeenCalledTimes(1);
    });
});
