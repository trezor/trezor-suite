import '@suite-common/test-utils/globalOverrides';

import { fireEvent, screen } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type FormState,
    type PrecomposedTransactionFinal,
    type TransactionReviewOutput,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';
import { createDeferred } from '@trezor/utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TransactionReviewModalBottomContent } from './TransactionReviewModalBottomContent';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

type RenderReviewParams = {
    txType?: 'yield';
    tokenSymbol?: string;
    outputs: TransactionReviewOutput[];
};

const renderReview = ({ txType, tokenSymbol, outputs }: RenderReviewParams) => {
    const symbol = asNetworkSymbol('eth');
    const precomposedTx: PrecomposedTransactionFinal = {
        type: 'final',
        fee: '420000',
        feePerByte: '20',
        feeLimit: '21000',
        totalSpent: '420000',
        bytes: 0,
        inputs: [],
        outputs: [{ address: 'private-recipient', amount: '123456' }],
        outputsPermutation: [0],
        ...(tokenSymbol ? { token: mockAccountToken({ symbol: tokenSymbol }) } : {}),
    };
    const precomposedForm: FormState = {
        outputs: [],
        feePerUnit: '20',
        feeLimit: '21000',
        options: ['broadcast'],
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
    };
    const analytics = mockDesktopAnalytics(mock<DesktopAnalyticsDep['analytics']['report']>());
    const { services } = createTestCompositionRoot<WithServices<DesktopAnalyticsDep>, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                stablecoinYield: {
                    ...mockInitialAppState.wallet.stablecoinYield,
                    txReview: txType === 'yield' ? { precomposedTx } : {},
                },
            },
        },
        services: () => ({ analytics }),
    });
    renderWithProviders(
        services,
        <TransactionReviewModalBottomContent
            decision={createDeferred<boolean, string | number | undefined>()}
            isSending={false}
            onSend={mock()}
            onCancel={mock()}
            handleTryAgain={mock()}
            txInfoState={{ precomposedTx, serializedTx: { tx: 'private-signed-tx', symbol } }}
            actionTranslation={{ id: 'SEND_TRANSACTION' }}
            hasTxReviewExpired={false}
            deadline={0}
            shouldCheckTxTimeValidity={false}
            account={mockWalletAccount({ symbol })}
            precomposedForm={precomposedForm}
            outputs={outputs}
        />,
    );

    fireEvent.click(screen.getByTestId('@modal/send'));

    return analytics.report;
};

describe('Transaction review token analytics', () => {
    it.each(['USDT', 'WETH', undefined])(
        'reports the yield transaction token %s even when device review outputs omit it',
        tokenSymbol => {
            const report = renderReview({ txType: 'yield', tokenSymbol, outputs: [] });

            expect(report).toHaveBeenCalledTimes(1);
            expect(report).toHaveBeenCalledWith({
                type: 'transaction-created',
                payload: expect.objectContaining({ txType: 'yield', tokens: tokenSymbol ?? '' }),
            });
            expect(JSON.stringify(report.mock.calls)).not.toContain('private-');
        },
    );

    it('keeps all review output token symbols for a regular send', () => {
        const report = renderReview({
            outputs: ['USDT', 'USDC'].map(symbol => ({
                type: 'amount',
                value: '123456',
                token: mockAccountToken({ symbol }),
            })),
        });

        expect(report).toHaveBeenCalledWith({
            type: 'transaction-created',
            payload: expect.objectContaining({ txType: undefined, tokens: 'USDT,USDC' }),
        });
    });
});
