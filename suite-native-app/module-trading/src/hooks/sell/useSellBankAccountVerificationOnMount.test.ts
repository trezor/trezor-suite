import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useSellBankAccountVerificationOnMount } from './useSellBankAccountVerificationOnMount';

describe('useSellBankAccountVerificationOnMount', () => {
    it('checks bank account verification only on mount', async () => {
        const doBankAccountVerificationCheck = jest.fn();
        const { rerender } = await renderHookWithBasicProvider(
            () =>
                useSellBankAccountVerificationOnMount({
                    doBankAccountVerificationCheck,
                }),
            { initialProps: {} },
        );

        await rerender({});

        expect(doBankAccountVerificationCheck).toHaveBeenCalledTimes(1);
    });
});
