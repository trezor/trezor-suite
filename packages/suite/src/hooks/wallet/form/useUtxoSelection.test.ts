import { useForm } from 'react-hook-form';

import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    testMocks,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { transactionsActions } from '@suite-common/wallet-core';
import {
    type FormState,
    type UtxoSorting,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';

import { type WalletState, walletReducers } from 'src/reducers/wallet';
import { type SendContextValues } from 'src/types/wallet/sendForm';

import { useUtxoSelection } from './useUtxoSelection';

type UtxoSelectionTestState = { wallet: WalletState };

// The pending transaction was first seen before the confirmed one was mined, so the expected order
// holds only if the confirmed transaction, stored after the unfetched page, is found.
const PENDING_TRANSACTION = testMocks.getWalletTransaction({
    txid: 'b'.repeat(64),
    blockHeight: -1,
    blockTime: 1700000000,
});
const CONFIRMED_TRANSACTION = testMocks.getWalletTransaction({
    txid: 'a'.repeat(64),
    blockHeight: 800000,
    blockTime: 1700000100,
});

const PENDING_UTXO = testMocks.getUtxo({
    txid: PENDING_TRANSACTION.txid,
    vout: 0,
    blockHeight: 0,
    confirmations: 0,
});
const CONFIRMED_UTXO = testMocks.getUtxo({
    txid: CONFIRMED_TRANSACTION.txid,
    vout: 0,
    blockHeight: 800000,
});

const ACCOUNT = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    utxo: [PENDING_UTXO, CONFIRMED_UTXO],
});

const TXS_PER_PAGE = getTxsPerPage(ACCOUNT.networkType);

const FIRST_PAGE = [
    PENDING_TRANSACTION,
    ...Array.from({ length: TXS_PER_PAGE - 1 }, (_, index) =>
        testMocks.getWalletTransaction({ txid: index.toString(16).padStart(64, '0') }),
    ),
];

const addPage = (transactions: WalletAccountTransaction[], page: number) =>
    transactionsActions.addTransaction({
        transactions,
        account: ACCOUNT,
        page,
        perPage: TXS_PER_PAGE,
    });

// The first page is fetched with the account and the third one when the user opens it in the
// transaction list, so the second page stays a hole in the account transactions.
const createStoreWithUnfetchedSecondPage = () => {
    const { services } = createTestCompositionRoot<void, UtxoSelectionTestState>({
        reducer: { wallet: walletReducers },
    });
    services.store.dispatch(addPage(FIRST_PAGE, 1));
    services.store.dispatch(addPage([CONFIRMED_TRANSACTION], 3));

    return services;
};

const renderUtxoSelection = (utxoSorting: UtxoSorting) => {
    const services = createStoreWithUnfetchedSecondPage();

    const accountTransactions =
        services.store.getState().wallet.transactions.transactions[ACCOUNT.key] ?? [];
    expect(TXS_PER_PAGE in accountTransactions).toBe(false);
    expect(accountTransactions[2 * TXS_PER_PAGE]).toEqual(CONFIRMED_TRANSACTION);

    return renderHookWithStoreProvider(
        () => {
            const methods = useForm<FormState>({
                defaultValues: {
                    options: ['broadcast', 'utxoSelection'],
                    utxoSorting,
                    selectedUtxos: [],
                    isCoinControlEnabled: false,
                },
            });

            return useUtxoSelection({
                ...methods,
                account: ACCOUNT,
                composedLevels: undefined,
                composeRequest: mock<SendContextValues['composeTransaction']>(),
                excludedUtxos: {},
            });
        },
        { services },
    );
};

describe('useUtxoSelection', () => {
    it.each<[UtxoSorting, string[]]>([
        ['newestFirst', [CONFIRMED_UTXO.txid, PENDING_UTXO.txid]],
        ['oldestFirst', [PENDING_UTXO.txid, CONFIRMED_UTXO.txid]],
    ])(
        'sorts UTXOs %s while a page of the account transactions is not fetched',
        (utxoSorting, expectedTxids) => {
            const { result } = renderUtxoSelection(utxoSorting);

            expect(result.current.spendableUtxos.map(utxo => utxo.txid)).toEqual(expectedTxids);
        },
    );
});
