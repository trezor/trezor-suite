import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { createDeferred } from '@trezor/utils';

import { type AppState } from 'src/reducers/store';
import { type SendSession } from 'src/support/chainSend/SendSessionContext';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import {
    RuntimeChainTransactionReview,
    type RuntimeChainTransactionReviewProps,
} from './RuntimeChainTransactionReview';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

const session: Extract<SendSession, { kind: 'runtime' }> = {
    kind: 'runtime',
    runtime: {
        network: {
            symbol: asNetworkSymbol('abc'),
            chainId: 777,
            name: 'Example Chain',
            nativeSymbol: 'EXC',
            decimals: 18,
            rpcUrls: ['https://rpc.example.com'],
            source: 'user',
        },
        account: {
            symbol: asNetworkSymbol('abc'),
            descriptor: '0xabc',
            index: 0,
            path: "m/44'/60'/0'/0/0",
            accountType: 'normal',
            deviceState: 'state',
            balance: '1000000000000000000',
            availableBalance: '1000000000000000000',
            formattedBalance: '1',
        },
        walletAccountKey: '0xabc-eth-state' as AccountKey,
    },
    precomposedForm: {
        outputs: [{ address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', amount: '0.5' }],
    } as FormState,
    precomposedTx: {
        type: 'final',
        fee: '21000000000000',
        feePerByte: '1',
        feeLimit: '21000',
        totalSpent: '500021000000000000',
        outputs: [],
    } as unknown as GeneralPrecomposedTransactionFinal,
    preparedNonce: '4',
};

const renderReview = (
    reviewed: typeof session,
    decision?: RuntimeChainTransactionReviewProps['decision'],
) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });

    renderWithProviders(
        services,
        <RuntimeChainTransactionReview
            session={reviewed}
            decision={decision}
            cancelSignTx={jest.fn()}
        />,
    );
};

describe(RuntimeChainTransactionReview.name, () => {
    it('shows what the device signs for the runtime network', () => {
        renderReview(session);

        expect(screen.getByTestId('@runtime-chain-review/chain-id')).toHaveTextContent('777');
        expect(screen.getByTestId('@runtime-chain-review/recipient')).toHaveTextContent(
            '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        );
        expect(screen.getByTestId('@runtime-chain-review/amount')).toHaveTextContent('0.5 EXC');
        expect(screen.getByTestId('@runtime-chain-review/fee')).toHaveTextContent('0.000021 EXC');
        expect(screen.getByTestId('@runtime-chain-review/nonce')).toHaveTextContent('4');
        expect(screen.getByText(/shows chain 777 as an unknown network/)).toBeInTheDocument();
        // Nothing to broadcast before the device signed.
        expect(screen.queryByTestId('@runtime-chain-review/send')).not.toBeInTheDocument();
    });

    it('broadcasts once signed and the user sends it', async () => {
        const decision = createDeferred<boolean, string | number | undefined>(undefined);
        renderReview(
            {
                ...session,
                serializedTx: { tx: 'signed-hex', symbol: session.runtime.network.symbol },
            },
            decision,
        );

        await userEvent.click(screen.getByTestId('@runtime-chain-review/send'));

        await expect(decision.promise).resolves.toBe(true);
    });
});
