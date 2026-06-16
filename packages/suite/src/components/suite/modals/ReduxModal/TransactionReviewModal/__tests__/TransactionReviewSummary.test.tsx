import '@suite-common/test-utils/src/globalOverrides';

import { screen, waitFor } from '@testing-library/react';

import { configureMockStore } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { extraDependenciesDesktopMock } from 'src/support/tests/extraDependenciesDesktop.mock';
import { renderWithProviders } from 'src/support/tests/hooksHelper';

import { TransactionReviewSummary } from '../TransactionReviewSummary';

jest.mock('@suite-common/tx-simulation', () => ({}));

jest.mock('@suite/account', () => ({
    ...jest.requireActual('@suite/account'),
    AccountLabel: () => null,
}));

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span data-testid={id}>{id}</span>,
}));

const ethAccount = mockWalletAccount({ symbol: 'eth' }) as Account;

const tx = {
    type: 'final',
    feeLimit: '21000',
    maxFeePerGas: '20',
    maxPriorityFeePerGas: '2',
    feePerByte: '20',
    fee: '420000000000000',
    totalSpent: '420000000000000',
    inputs: [],
    outputs: [],
} as any;

const sentTx = (nonce: number) =>
    ({ type: 'sent', blockHeight: 100, ethereumSpecific: { nonce } }) as any;

const render = (precomposedForm?: Record<string, unknown>) => {
    const store = configureMockStore({
        preloadedState: {
            ...initialAppState,
            wallet: {
                ...initialAppState.wallet,
                selectedAccount: { ...initialAppState.wallet.selectedAccount, account: ethAccount },
                fees: { ...initialAppState.wallet.fees },
                send: { ...initialAppState.wallet.send, drafts: {}, precomposedForm },
                transactions: {
                    ...initialAppState.wallet.transactions,
                    // confirmed nonces 0..5 -> resolved next nonce 6
                    transactions: {
                        [ethAccount.key]: Array.from({ length: 6 }, (_, i) => sentTx(i)),
                    },
                },
            },
        },
    });

    return renderWithProviders(
        store,
        extraDependenciesDesktopMock.services,
        <TransactionReviewSummary tx={tx} account={ethAccount} onDetailsClick={jest.fn()} />,
    );
};

describe('TransactionReviewSummary – EVM nonce', () => {
    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '6' } },
        } as any);
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('shows the resolved nonce when there is no override', async () => {
        render(undefined);

        await waitFor(() =>
            expect(screen.getByTestId('@modal/ethereum/nonce')).toHaveTextContent('6'),
        );
    });

    it('shows the custom nonce override in place of the resolved nonce', async () => {
        render({ ethereumNonce: '3' });

        await waitFor(() =>
            expect(screen.getByTestId('@modal/ethereum/nonce')).toHaveTextContent('3'),
        );
    });
});
