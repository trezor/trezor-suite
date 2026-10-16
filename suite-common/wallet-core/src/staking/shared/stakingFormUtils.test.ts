import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type ComposeActionContext,
    type ExternalOutput,
    type PrecomposedTransaction,
    type StakeFormState,
    type StakeType,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type FeeLevel } from '@trezor/connect';
import { mock } from '@trezor/dependency-injection';
import type { EstimatedFee } from '@trezor/network-solana/types';

import { calculateStakeFormTransaction, composeStakingTransaction } from './stakingFormUtils';

const ETH = asNetworkSymbol('eth');
const POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';

const NORMAL_FEE_LEVEL: FeeLevel = {
    label: 'normal',
    blocks: -1,
    feePerUnit: '20',
    feeLimit: '100000',
};

const STAKING_PARAMS = {
    feeInBaseUnits: '1000',
    minBalanceForStakingInBaseUnits: '15000',
    minAmountForStakingInBaseUnits: '10000',
    minAmountForWithdrawalInBaseUnits: '5000',
};

const NOT_ENOUGH_FEE_ERROR = {
    type: 'error',
    error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
    errorMessage: {
        id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
        values: { networkDisplaySymbol: 'ETH' },
    },
};

type CalculateParams = {
    output: ExternalOutput;
    availableBalance?: string;
    feeLevel?: FeeLevel;
    compareWithAmount?: boolean;
    estimatedFee?: EstimatedFee;
};

const calculate = ({
    output,
    availableBalance = '100000',
    feeLevel = NORMAL_FEE_LEVEL,
    compareWithAmount = true,
    estimatedFee,
}: CalculateParams) =>
    calculateStakeFormTransaction(
        availableBalance,
        output,
        feeLevel,
        compareWithAmount,
        ETH,
        STAKING_PARAMS,
        estimatedFee,
    );

describe('calculateStakeFormTransaction', () => {
    it('composes a final transaction for a payment output', () => {
        const result = calculate({
            output: { type: 'payment', address: POOL_ADDRESS, amount: '20000' },
        });

        expect(result).toEqual({
            type: 'final',
            totalSpent: '21000',
            max: undefined,
            fee: '1000',
            feePerByte: '20',
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            feeLimit: '100000',
            bytes: 0,
            inputs: [],
            outputsPermutation: [0],
            outputs: [{ address: POOL_ADDRESS, amount: '20000', script_type: 'PAYTOADDRESS' }],
        });
    });

    it('passes EIP-1559 fee level fields through', () => {
        const result = calculate({
            output: { type: 'payment', address: POOL_ADDRESS, amount: '20000' },
            feeLevel: { ...NORMAL_FEE_LEVEL, maxFeePerGas: '30', maxPriorityFeePerGas: '2' },
        });

        expect(result).toMatchObject({ maxFeePerGas: '30', maxPriorityFeePerGas: '2' });
    });

    it('keeps the withdrawal reserve out of the send-max amount', () => {
        const result = calculate({
            output: { type: 'send-max', address: POOL_ADDRESS },
        });

        expect(result).toMatchObject({
            type: 'final',
            max: '94000',
            totalSpent: '95000',
            outputs: [{ address: POOL_ADDRESS, amount: '94000' }],
        });
    });

    it('falls back to the minimum stake when the balance cannot cover the reserve', () => {
        const result = calculate({
            output: { type: 'send-max', address: POOL_ADDRESS },
            availableBalance: '15999',
        });

        expect(result).toMatchObject({
            type: 'final',
            max: '10000',
            outputs: [{ address: POOL_ADDRESS, amount: '10000' }],
        });
    });

    it('returns a nonfinal transaction for send-max without an address', () => {
        const result = calculate({ output: { type: 'send-max-noaddress' } });

        expect(result).toEqual({
            type: 'nonfinal',
            totalSpent: '95000',
            max: '94000',
            fee: '1000',
            feePerByte: '20',
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            feeLimit: '100000',
            bytes: 0,
            inputs: [],
        });
    });

    it('returns a nonfinal transaction for a payment without an address', () => {
        const result = calculate({ output: { type: 'payment-noaddress', amount: '20000' } });

        expect(result).toMatchObject({ type: 'nonfinal', totalSpent: '21000', max: undefined });
    });

    it('rejects when the fee alone exceeds the balance', () => {
        const result = calculate({
            output: { type: 'payment', address: POOL_ADDRESS, amount: '0' },
            availableBalance: '999',
            compareWithAmount: false,
        });

        expect(result).toEqual(NOT_ENOUGH_FEE_ERROR);
    });

    it('rejects when the amount with fee exceeds the balance and the amount is compared', () => {
        const result = calculate({
            output: { type: 'payment', address: POOL_ADDRESS, amount: '99500' },
        });

        expect(result).toEqual(NOT_ENOUGH_FEE_ERROR);
    });

    it('ignores the amount against the balance when it is not compared', () => {
        const result = calculate({
            output: { type: 'payment', address: POOL_ADDRESS, amount: '99500' },
            compareWithAmount: false,
        });

        expect(result).toMatchObject({ type: 'final', totalSpent: '100500' });
    });

    it('reports a failed fee estimation as its own error', () => {
        const result = calculate({
            output: { type: 'payment', address: POOL_ADDRESS, amount: '20000' },
            estimatedFee: { success: false },
        });

        expect(result).toEqual({
            type: 'error',
            error: 'TR_STAKE_FEE_ESTIMATION_FAILED',
            errorMessage: { id: 'TR_STAKE_FEE_ESTIMATION_FAILED' },
        });
    });

    it('composes normally with a successful fee estimation', () => {
        const result = calculate({
            output: { type: 'payment', address: POOL_ADDRESS, amount: '20000' },
            estimatedFee: { success: true, payload: { feePerUnit: '20', feePerTx: '1000' } },
        });

        expect(result).toMatchObject({ type: 'final', totalSpent: '21000' });
    });
});

const ONE_ETHER_IN_WEI = '1000000000000000000';

const buildFormValues = (
    overrides: Partial<StakeFormState> & { amount?: string; stakeType?: StakeType } = {},
): StakeFormState => {
    const { amount = '1', stakeType = 'stake', ...rest } = overrides;

    return {
        outputs: [
            {
                address: POOL_ADDRESS,
                amount,
                type: 'payment',
                token: null,
                fiat: '',
                currency: { label: '', value: '' },
            },
        ],
        options: [],
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
        selectedFee: 'normal',
        feePerUnit: '',
        feeLimit: '',
        stakeType,
        ...rest,
    };
};

const composeContext: ComposeActionContext = {
    account: mockWalletAccount({ symbol: ETH, availableBalance: '5000000000000000000' }),
    network: getNetwork(ETH),
    feeInfo: {
        blockHeight: 1,
        blockTime: 12,
        minFee: 1,
        maxFee: 100,
        minPriorityFee: 1,
        levels: [NORMAL_FEE_LEVEL],
    },
};

const finalTransaction = (overrides: Partial<PrecomposedTransaction> = {}) =>
    ({
        type: 'final',
        totalSpent: '1000000000000001000',
        max: undefined,
        fee: '1000',
        feePerByte: '20',
        feeLimit: '100000',
        bytes: 0,
        inputs: [],
        outputsPermutation: [0],
        outputs: [{ address: POOL_ADDRESS, amount: ONE_ETHER_IN_WEI, script_type: 'PAYTOADDRESS' }],
        ...overrides,
    }) as PrecomposedTransaction;

type CalculateTransaction = Parameters<typeof composeStakingTransaction>[3];

describe('composeStakingTransaction', () => {
    const highFeeLevel: FeeLevel = { ...NORMAL_FEE_LEVEL, label: 'high', feePerUnit: '40' };

    it('returns nothing without a valid output', () => {
        const calculateTransaction = mock<CalculateTransaction>(() => finalTransaction());

        const result = composeStakingTransaction(
            buildFormValues({ amount: '' }),
            composeContext,
            [NORMAL_FEE_LEVEL],
            calculateTransaction,
        );

        expect(result).toBeUndefined();
        expect(calculateTransaction).not.toHaveBeenCalled();
    });

    it('calculates every fee level with the output converted to base units', () => {
        const calculateTransaction = mock<CalculateTransaction>(() => finalTransaction());
        const estimatedFee: EstimatedFee = { success: true, payload: { feePerUnit: '20' } };

        const result = composeStakingTransaction(
            buildFormValues(),
            composeContext,
            [NORMAL_FEE_LEVEL, highFeeLevel],
            calculateTransaction,
            estimatedFee,
        );

        expect(calculateTransaction).toHaveBeenCalledTimes(2);
        expect(calculateTransaction).toHaveBeenNthCalledWith(
            1,
            '5000000000000000000',
            { type: 'payment', address: POOL_ADDRESS, amount: ONE_ETHER_IN_WEI },
            NORMAL_FEE_LEVEL,
            true,
            ETH,
            estimatedFee,
        );
        expect(calculateTransaction).toHaveBeenNthCalledWith(
            2,
            expect.anything(),
            expect.anything(),
            highFeeLevel,
            true,
            ETH,
            estimatedFee,
        );
        expect(Object.keys(result ?? {})).toEqual(['normal', 'high']);
    });

    it('compares the amount with the balance only when staking', () => {
        const calculateTransaction = mock<CalculateTransaction>(() => finalTransaction());

        composeStakingTransaction(
            buildFormValues({ stakeType: 'unstake' }),
            composeContext,
            [NORMAL_FEE_LEVEL],
            calculateTransaction,
        );

        expect(calculateTransaction).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            NORMAL_FEE_LEVEL,
            false,
            ETH,
            undefined,
        );
    });

    it('formats the max amount to units and applies the custom fee limit', () => {
        const calculateTransaction = mock<CalculateTransaction>(() =>
            finalTransaction({ max: '1500000000000000000', estimatedFeeLimit: '21000' }),
        );

        const result = composeStakingTransaction(
            buildFormValues({ setMaxOutputId: 0 }),
            composeContext,
            [NORMAL_FEE_LEVEL],
            calculateTransaction,
            undefined,
            '250000',
        );

        expect(result?.normal).toMatchObject({ max: '1.5', estimatedFeeLimit: '250000' });
    });

    it('keeps the estimated fee limit of the level without a custom one', () => {
        const calculateTransaction = mock<CalculateTransaction>(() =>
            finalTransaction({ estimatedFeeLimit: '21000' }),
        );

        const result = composeStakingTransaction(
            buildFormValues(),
            composeContext,
            [NORMAL_FEE_LEVEL],
            calculateTransaction,
        );

        expect(result?.normal).toMatchObject({ max: undefined, estimatedFeeLimit: '21000' });
    });

    it('describes the insufficient fee error with the network display symbol', () => {
        const calculateTransaction = mock<CalculateTransaction>(
            () =>
                ({
                    type: 'error',
                    error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                }) as PrecomposedTransaction,
        );

        const result = composeStakingTransaction(
            buildFormValues(),
            composeContext,
            [NORMAL_FEE_LEVEL],
            calculateTransaction,
        );

        expect(result?.normal).toEqual(NOT_ENOUGH_FEE_ERROR);
    });

    it('leaves other compose errors untouched', () => {
        const error = {
            type: 'error',
            error: 'TR_STAKE_FEE_ESTIMATION_FAILED',
            errorMessage: { id: 'TR_STAKE_FEE_ESTIMATION_FAILED' },
        } as PrecomposedTransaction;
        const calculateTransaction = mock<CalculateTransaction>(() => error);

        const result = composeStakingTransaction(
            buildFormValues(),
            composeContext,
            [NORMAL_FEE_LEVEL],
            calculateTransaction,
        );

        expect(result?.normal).toEqual(error);
    });
});
