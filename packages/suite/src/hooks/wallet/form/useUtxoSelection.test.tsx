import { type DefaultValues, useForm } from 'react-hook-form';

import { type CoinjoinAccount, type CoinjoinState } from '@suite/coinjoin';
import { mock } from '@suite-common/dependency-injection';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    testMocks,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TransactionsState } from '@suite-common/wallet-core';
import {
    type Account,
    type ExcludedUtxos,
    type FormState,
    type PrecomposedLevels,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getUtxoOutpoint } from '@suite-common/wallet-utils';
import { type AccountUtxo, type PROTO } from '@trezor/connect';

import { type SendContextValues } from 'src/types/wallet/sendForm';

import { useUtxoSelection } from './useUtxoSelection';

const ROUND_ID = 'round-1';

const UTXO_A = testMocks.getUtxo({ txid: 'a'.repeat(64), vout: 0, address: 'address-a' });
const UTXO_B = testMocks.getUtxo({ txid: 'b'.repeat(64), vout: 1, address: 'address-b' });
const UTXO_C = testMocks.getUtxo({ txid: 'c'.repeat(64), vout: 0, address: 'address-c' });

const ACCOUNT = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    accountType: 'coinjoin',
    utxo: [UTXO_A, UTXO_B, UTXO_C],
});

type RegisteredInmate = NonNullable<CoinjoinAccount['prison']>[string];

// A prison entry counts as registered when its round is backed by a transaction candidate.
const registeredInmate: RegisteredInmate = {
    type: 'input',
    sentenceStart: 0,
    sentenceEnd: 0,
    roundId: ROUND_ID,
};

type MockCoinjoinAccountParams = {
    account: Account;
    registeredUtxos: AccountUtxo[];
};

const mockCoinjoinAccount = ({
    account,
    registeredUtxos,
}: MockCoinjoinAccountParams): CoinjoinAccount => ({
    key: account.key,
    symbol: account.symbol,
    rawLiquidityClue: null,
    transactionCandidates: [{ roundId: ROUND_ID }],
    prison: Object.fromEntries(
        registeredUtxos.map(utxo => [getUtxoOutpoint(utxo), registeredInmate]),
    ),
});

const mockComposedInput = (utxo: AccountUtxo): PROTO.TxInputType => ({
    prev_hash: utxo.txid,
    prev_index: utxo.vout,
    amount: utxo.amount,
    address_n: [],
});

// Only the inputs matter to the hook; the rest is the minimum a final compose result carries.
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

type UtxoSelectionTestState = {
    wallet: {
        transactions: Pick<TransactionsState, 'transactions'>;
        coinjoin: Pick<CoinjoinState, 'accounts'>;
    };
};

type UtxoSelectionHookProps = {
    account: Account;
    composedLevels?: PrecomposedLevels;
};

type RenderUtxoSelectionParams = UtxoSelectionHookProps & {
    defaultValues: DefaultValues<FormState>;
    excludedUtxos?: ExcludedUtxos;
    coinjoinAccounts?: CoinjoinAccount[];
};

const renderUtxoSelection = ({
    account,
    composedLevels,
    defaultValues,
    excludedUtxos = {},
    coinjoinAccounts = [],
}: RenderUtxoSelectionParams) => {
    const preloadedState: UtxoSelectionTestState = {
        wallet: {
            transactions: { transactions: {} },
            coinjoin: { accounts: coinjoinAccounts },
        },
    };
    const { services } = createTestCompositionRoot<void, UtxoSelectionTestState>({
        preloadedState,
    });
    const composeRequest = mock<SendContextValues['composeTransaction']>();
    const initialProps: UtxoSelectionHookProps = { account, composedLevels };

    const hook = renderHookWithStoreProvider(
        (props: UtxoSelectionHookProps) => {
            const methods = useForm<FormState>({ defaultValues });

            return useUtxoSelection({ ...methods, ...props, composeRequest, excludedUtxos });
        },
        { services, initialProps },
    );

    return { ...hook, composeRequest };
};

describe('useUtxoSelection', () => {
    describe('toggleCheckAllUtxos', () => {
        it('checks the whole top category and keeps the UTXOs checked in lower categories', () => {
            const { result, composeRequest } = renderUtxoSelection({
                account: ACCOUNT,
                excludedUtxos: { [getUtxoOutpoint(UTXO_C)]: 'dust' },
                defaultValues: { isCoinControlEnabled: true, selectedUtxos: [UTXO_C] },
            });

            act(() => result.current.toggleCheckAllUtxos());

            expect(result.current.selectedUtxos).toEqual([UTXO_A, UTXO_B, UTXO_C]);
            expect(result.current.allUtxosSelected).toBe(true);
            expect(composeRequest).toHaveBeenCalledTimes(1);
        });

        it('drops a stale lower-category selection registered in a coinjoin round in one pass', () => {
            const { result, composeRequest } = renderUtxoSelection({
                account: ACCOUNT,
                excludedUtxos: { [getUtxoOutpoint(UTXO_C)]: 'dust' },
                coinjoinAccounts: [
                    mockCoinjoinAccount({ account: ACCOUNT, registeredUtxos: [UTXO_C] }),
                ],
                // The form holds its own copies of the UTXOs, never the account's objects.
                defaultValues: { isCoinControlEnabled: false, selectedUtxos: [{ ...UTXO_C }] },
            });

            act(() => result.current.toggleCheckAllUtxos());

            expect(result.current.selectedUtxos).toEqual([UTXO_A, UTXO_B]);
            expect(result.current.isCoinControlEnabled).toBe(true);
            expect(composeRequest).toHaveBeenCalledTimes(1);
        });

        it('unchecks everything when the whole top category is checked', () => {
            const { result, composeRequest } = renderUtxoSelection({
                account: ACCOUNT,
                excludedUtxos: { [getUtxoOutpoint(UTXO_C)]: 'dust' },
                defaultValues: { isCoinControlEnabled: true, selectedUtxos: [UTXO_B, UTXO_A] },
            });

            expect(result.current.allUtxosSelected).toBe(true);

            act(() => result.current.toggleCheckAllUtxos());

            expect(result.current.selectedUtxos).toEqual([]);
            expect(composeRequest).toHaveBeenCalledTimes(1);
        });
    });

    describe('spent and coinjoin-registered selections', () => {
        it('unchecks a UTXO once it is registered in a coinjoin round', () => {
            const { result, composeRequest } = renderUtxoSelection({
                account: ACCOUNT,
                coinjoinAccounts: [
                    mockCoinjoinAccount({ account: ACCOUNT, registeredUtxos: [UTXO_B] }),
                ],
                defaultValues: { isCoinControlEnabled: true, selectedUtxos: [UTXO_A, UTXO_B] },
            });

            expect(result.current.selectedUtxos).toEqual([UTXO_A]);
            expect(composeRequest).toHaveBeenCalledTimes(1);
        });

        it('unchecks a UTXO once the account no longer has it', () => {
            const { result, rerender, composeRequest } = renderUtxoSelection({
                account: ACCOUNT,
                defaultValues: { isCoinControlEnabled: true, selectedUtxos: [UTXO_A, UTXO_B] },
            });

            rerender({ account: { ...ACCOUNT, utxo: [UTXO_A, UTXO_C] } });

            expect(result.current.selectedUtxos).toEqual([UTXO_A]);
            expect(composeRequest).toHaveBeenCalledTimes(1);
        });

        it('leaves the selection untouched when nothing was spent or registered', () => {
            const { result, composeRequest } = renderUtxoSelection({
                account: ACCOUNT,
                coinjoinAccounts: [
                    mockCoinjoinAccount({ account: ACCOUNT, registeredUtxos: [UTXO_C] }),
                ],
                defaultValues: { isCoinControlEnabled: true, selectedUtxos: [UTXO_A, UTXO_B] },
            });

            expect(result.current.selectedUtxos).toEqual([UTXO_A, UTXO_B]);
            expect(composeRequest).not.toHaveBeenCalled();
        });
    });

    describe('UTXOs preselected by the composed transaction', () => {
        it('checks the inputs of the composed transaction when coin control gets enabled', () => {
            const { result, composeRequest } = renderUtxoSelection({
                account: ACCOUNT,
                composedLevels: mockComposedLevels([UTXO_C, UTXO_A]),
                defaultValues: { isCoinControlEnabled: false, selectedUtxos: [] },
            });

            act(() => result.current.toggleCoinControl());

            expect(result.current.selectedUtxos).toEqual([UTXO_A, UTXO_C]);
            expect(result.current.isCoinControlEnabled).toBe(true);
            expect(composeRequest).toHaveBeenCalledTimes(1);
        });

        it('adds a checked UTXO to the inputs of the composed transaction', () => {
            const { result } = renderUtxoSelection({
                account: ACCOUNT,
                composedLevels: mockComposedLevels([UTXO_A]),
                defaultValues: { isCoinControlEnabled: false, selectedUtxos: [] },
            });

            act(() => result.current.toggleUtxoSelection(UTXO_B));

            expect(result.current.selectedUtxos).toEqual([UTXO_A, UTXO_B]);
            expect(result.current.isCoinControlEnabled).toBe(true);
        });
    });
});
