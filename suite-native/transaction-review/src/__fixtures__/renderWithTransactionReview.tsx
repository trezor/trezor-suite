import { type ReactElement } from 'react';

import { type RenderResult, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { ETH_ACCOUNT_KEY, mockWalletState } from './walletState';
import {
    TransactionReviewProvider,
    type TransactionReviewProviderProps,
} from '../hooks/useTransactionReview';

export type TransactionReviewTestProviderProps = Partial<
    Omit<TransactionReviewProviderProps, 'children'>
>;

type RenderWithTransactionReviewOptions = {
    providerProps?: TransactionReviewTestProviderProps;
    preloadedState?: object;
};

export const renderWithTransactionReview = async (
    element: ReactElement,
    {
        providerProps = {},
        preloadedState = { wallet: mockWalletState() },
    }: RenderWithTransactionReviewOptions = {},
): Promise<RenderResult> =>
    await renderWithStoreProvider(
        <TransactionReviewProvider
            accountKey={ETH_ACCOUNT_KEY}
            titleTranslationId="moduleSend.review.outputs.title"
            summaryTranslationId="transactionManagement.review.outputs.summary.label"
            sendButtonTranslationId="moduleSend.review.outputs.submitButton"
            isTransactionAlreadySigned={false}
            {...providerProps}
        >
            {element}
        </TransactionReviewProvider>,
        { preloadedState },
    );
