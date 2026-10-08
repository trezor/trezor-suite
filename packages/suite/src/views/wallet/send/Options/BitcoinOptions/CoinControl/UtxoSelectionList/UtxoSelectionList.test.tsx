import { type DefaultValues, useForm } from 'react-hook-form';

import { fireEvent, screen } from '@testing-library/react';

import { initialMetadataState } from '@suite/metadata';
import { mock } from '@suite-common/dependency-injection';
import { type WithServices } from '@suite-common/redux-utils';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import { createTestCompositionRoot, testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type Account, type FormState, type PrecomposedLevels } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type AccountUtxo, type PROTO } from '@trezor/connect';
import { ShieldCheckIcon } from '@trezor/icons';

import { useUtxoSelection } from 'src/hooks/wallet/form/useUtxoSelection';
import { SendContext } from 'src/hooks/wallet/useSendForm';
import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';
import { type WalletAccountTransaction } from 'src/types/wallet';
import { type SendContextValues } from 'src/types/wallet/sendForm';

import { UtxoSelectionList } from './UtxoSelectionList';
import { mockInitialAppState } from '../../../../../../../../mocks/mockInitialAppState';

// The editable address label of every row measures itself with an observer jsdom lacks.
global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

const UTXO_A0 = testMocks.getUtxo({ txid: 'a'.repeat(64), vout: 0, address: 'address-a0' });
const UTXO_A1 = testMocks.getUtxo({ txid: 'a'.repeat(64), vout: 1, address: 'address-a1' });
const UTXO_B = testMocks.getUtxo({ txid: 'b'.repeat(64), vout: 0, address: 'address-b' });
const UTXO_C = testMocks.getUtxo({ txid: 'c'.repeat(64), vout: 0, address: 'address-c' });

const TRANSACTION_A = testMocks.getWalletTransaction({
    txid: UTXO_A0.txid,
    blockTime: Date.UTC(2019, 0, 1) / 1000,
});
const TRANSACTION_B = testMocks.getWalletTransaction({
    txid: UTXO_B.txid,
    blockTime: Date.UTC(2021, 5, 15) / 1000,
});
// Spent long ago, so it belongs to no row.
const TRANSACTION_D = testMocks.getWalletTransaction({
    txid: 'd'.repeat(64),
    blockTime: Date.UTC(2023, 2, 3) / 1000,
});

const mockAccount = (utxo: AccountUtxo[]): Account =>
    mockWalletAccount({ symbol: asNetworkSymbol('btc'), utxo });

const mockComposedInput = (utxo: AccountUtxo): PROTO.TxInputType => ({
    prev_hash: utxo.txid,
    prev_index: utxo.vout,
    amount: utxo.amount,
    address_n: [],
});

// Only the inputs matter to the rows; the rest is the minimum a final compose result carries.
const mockComposedLevels = (inputs: AccountUtxo[]): PrecomposedLevels => ({
    normal: {
        type: 'final',
        totalSpent: '0',
        fee: '0',
        feePerByte: '0',
        bytes: 0,
        inputs: inputs.map(mockComposedInput),
        outputs: [],
        outputsPermutation: [],
    },
});

const composeRequest = mock<SendContextValues['composeTransaction']>();

// The address label of every row goes through Suite Sync, nothing else is injected.
type UtxoSelectionListTestDeps = WithServices<SuiteSyncDep>;

type HarnessProps = {
    account: Account;
    defaultValues: DefaultValues<FormState>;
    composedLevels?: PrecomposedLevels;
    utxos?: AccountUtxo[];
};

// The real selection hook feeds the list the same way useSendForm does, so the rows and the
// check-all state react to clicks exactly as in the send form.
const Harness = ({ account, defaultValues, composedLevels, utxos }: HarnessProps) => {
    const methods = useForm<FormState>({ defaultValues });
    const utxoSelection = useUtxoSelection({
        ...methods,
        account,
        composedLevels,
        composeRequest,
        excludedUtxos: {},
    });
    const value = {
        ...methods,
        account,
        network: getNetwork(account.symbol),
        utxoSelection,
    } as SendContextValues;

    return (
        <SendContext.Provider value={value}>
            <span data-testid="all-utxos-selected">{String(utxoSelection.allUtxosSelected)}</span>
            <UtxoSelectionList
                description="description"
                heading="heading"
                icon={ShieldCheckIcon}
                utxos={utxos ?? account.utxo ?? []}
                withHeader={false}
            />
        </SendContext.Provider>
    );
};

const renderList = (props: HarnessProps, transactions: WalletAccountTransaction[] = []) => {
    const { services } = createTestCompositionRoot<UtxoSelectionListTestDeps, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            metadata: initialMetadataState,
            wallet: {
                ...mockInitialAppState.wallet,
                transactions: {
                    ...mockInitialAppState.wallet.transactions,
                    transactions: { [props.account.key]: transactions },
                },
            },
        },
        services: () => ({ suiteSync: mockSuiteSync() }),
    });

    return renderWithProviders(services, <Harness {...props} />);
};

const getCheckedStates = () =>
    screen.getAllByRole('checkbox').map(checkbox => (checkbox as HTMLInputElement).checked);

const clickCheckbox = (index: number) => {
    const checkbox = screen.getAllByRole('checkbox')[index];
    if (checkbox === undefined) {
        throw new Error(`There is no checkbox at index ${index}.`);
    }
    fireEvent.click(checkbox);
};

describe('UtxoSelectionList', () => {
    beforeEach(() => composeRequest.mockClear());

    describe('transaction of each row', () => {
        it('shows the timestamp of the transaction with the txid of the UTXO', () => {
            renderList(
                {
                    account: mockAccount([UTXO_A0, UTXO_B, UTXO_C]),
                    defaultValues: { isCoinControlEnabled: true, selectedUtxos: [] },
                },
                [TRANSACTION_D, TRANSACTION_B, TRANSACTION_A],
            );

            expect(screen.getByText(/January 1, 2019/)).toBeInTheDocument();
            expect(screen.getByText(/June 15, 2021/)).toBeInTheDocument();
            expect(screen.queryByText(/March 3, 2023/)).not.toBeInTheDocument();
        });

        it('shows the transaction of the row, not the first transaction of the account', () => {
            renderList(
                {
                    account: mockAccount([UTXO_A0, UTXO_B]),
                    defaultValues: { isCoinControlEnabled: true, selectedUtxos: [] },
                    utxos: [UTXO_B],
                },
                [TRANSACTION_A, TRANSACTION_B],
            );

            expect(screen.getByText(/June 15, 2021/)).toBeInTheDocument();
            expect(screen.queryByText(/January 1, 2019/)).not.toBeInTheDocument();
        });

        it('shows no timestamp while the transaction of the UTXO is not loaded yet', () => {
            renderList(
                {
                    account: mockAccount([UTXO_C]),
                    defaultValues: { isCoinControlEnabled: true, selectedUtxos: [] },
                },
                [TRANSACTION_A, TRANSACTION_B],
            );

            expect(screen.queryByText(/2019|2021/)).not.toBeInTheDocument();
        });
    });

    describe('checked state of each row', () => {
        it('checks the rows selected by outpoint and reports once the whole list is checked', () => {
            renderList({
                account: mockAccount([UTXO_A0, UTXO_A1, UTXO_B]),
                // The form holds its own copies of the UTXOs, never the account's objects.
                defaultValues: { isCoinControlEnabled: true, selectedUtxos: [{ ...UTXO_A1 }] },
            });

            expect(getCheckedStates()).toEqual([false, true, false]);
            expect(screen.getByTestId('all-utxos-selected')).toHaveTextContent('false');

            clickCheckbox(0);
            clickCheckbox(2);

            expect(getCheckedStates()).toEqual([true, true, true]);
            expect(screen.getByTestId('all-utxos-selected')).toHaveTextContent('true');
            expect(composeRequest).toHaveBeenCalledTimes(2);

            clickCheckbox(1);

            expect(getCheckedStates()).toEqual([true, false, true]);
            expect(screen.getByTestId('all-utxos-selected')).toHaveTextContent('false');
        });

        it('checks the inputs of the composed transaction while coin control is disabled', () => {
            renderList({
                account: mockAccount([UTXO_A0, UTXO_A1, UTXO_B]),
                composedLevels: mockComposedLevels([UTXO_B, UTXO_A1]),
                defaultValues: { isCoinControlEnabled: false, selectedUtxos: [] },
            });

            expect(getCheckedStates()).toEqual([false, true, true]);
            expect(screen.getByTestId('all-utxos-selected')).toHaveTextContent('false');
        });
    });
});
