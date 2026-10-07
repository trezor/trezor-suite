import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type FormState,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { type SendSession, SendSessionContext } from 'src/support/chainSend/SendSessionContext';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TransactionReviewEthereumNotes } from './TransactionReviewEthereumNotes';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') }) as Parameters<
    typeof TransactionReviewEthereumNotes
>[0]['account'];

const tx = {
    type: 'final',
    fee: '21000',
    feePerByte: '1',
    feeLimit: '21000',
    totalSpent: '21000',
    outputs: [],
} as unknown as GeneralPrecomposedTransactionFinal;

const renderNotes = (session: SendSession | undefined) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });

    renderWithProviders(
        services,
        <SendSessionContext.Provider value={{ session, setSession: jest.fn() }}>
            <TransactionReviewEthereumNotes account={account} tx={tx} />
        </SendSessionContext.Provider>,
    );
};

describe(TransactionReviewEthereumNotes.name, () => {
    it('shows the nonce a send is signed with through its chain network', () => {
        renderNotes({
            accountKey: account.key,
            precomposedForm: { ethereumNonce: '6' } as FormState,
            precomposedTx: tx,
            resolvedEthereumNonce: '7',
        });

        expect(screen.getByTestId('@modal/header/nonce/value')).toHaveTextContent('7');
    });

    it('shows no nonce while none is resolved and nothing else is under review', () => {
        renderNotes(undefined);

        expect(screen.queryByTestId('@modal/header/nonce')).not.toBeInTheDocument();
    });
});
