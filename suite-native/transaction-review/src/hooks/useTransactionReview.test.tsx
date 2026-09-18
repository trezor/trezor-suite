import { renderHookWithBasicProvider } from '@suite-native/test-utils';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import {
    TransactionReviewProvider,
    type TransactionReviewProviderProps,
    useTransactionReview,
} from './useTransactionReview';
import { ETH_ACCOUNT_KEY, mockWalletState } from '../__fixtures__/walletState';

const providerProps: Omit<TransactionReviewProviderProps, 'children'> = {
    accountKey: ETH_ACCOUNT_KEY,
    titleTranslationId: 'moduleSend.review.outputs.title',
    summaryTranslationId: 'transactionManagement.review.outputs.summary.label',
    sendButtonTranslationId: 'moduleSend.review.outputs.submitButton',
    isTransactionAlreadySigned: false,
};

describe('useTransactionReview', () => {
    it('should throw when used outside of the provider', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(renderHookWithBasicProvider(() => useTransactionReview())).rejects.toThrow(
            'useTransactionReview must be used within a TransactionReviewContext',
        );

        errorSpy.mockRestore();
    });

    it('should expose the resolved account and the provider props', async () => {
        const { result } = await renderHookWithStoreProvider(() => useTransactionReview(), {
            preloadedState: { wallet: mockWalletState() },
            wrapper: ({ children }) => (
                <TransactionReviewProvider {...providerProps}>{children}</TransactionReviewProvider>
            ),
        });

        expect(result.current.account?.key).toBe(ETH_ACCOUNT_KEY);
        expect(result.current.accountKey).toBe(ETH_ACCOUNT_KEY);
        expect(result.current.titleTranslationId).toBe('moduleSend.review.outputs.title');
        expect(result.current.isTransactionAlreadySigned).toBe(false);
        expect(result.current.txid).toBe('');
        expect(result.current.isSending).toBe(false);
        expect(result.current.transaction).toBeUndefined();
    });
});
