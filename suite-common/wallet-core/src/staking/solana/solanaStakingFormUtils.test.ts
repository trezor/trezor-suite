import { type NetworkSymbol, asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type ComposeActionContext,
    type StakeFormState,
    type StakeType,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';
import type { PrepareStakeSolTxResponse, SolanaTxMeta } from '@trezor/network-solana/types';

import {
    composeSolanaStakingTransaction,
    prepareSolanaStakeTxData,
} from './solanaStakingFormUtils';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        blockchainEstimateFee: jest.fn(),
    },
}));

const prepareStakeSolTxMock = jest.fn();
const prepareUnstakeSolTxMock = jest.fn();
const prepareClaimSolTxMock = jest.fn();
const selectSolanaConnectionMock = jest.fn();
const selectSolanaValidatorMock = jest.fn();

jest.mock('@trezor/network-solana/runtime', () => ({
    __esModule: true,
    default: () =>
        Promise.resolve({
            selectSolanaConnection: selectSolanaConnectionMock,
            selectSolanaValidator: selectSolanaValidatorMock,
            prepareStakeSolTx: prepareStakeSolTxMock,
            prepareUnstakeSolTx: prepareUnstakeSolTxMock,
            prepareClaimSolTx: prepareClaimSolTxMock,
        }),
}));

const SOL = asNetworkSymbol('sol');
const DESCRIPTOR = asAccountDescriptor('SoLDeScRiPtoR1111111111111111111111111111111');
const BLOCKCHAIN_URL = 'https://solana.example';
const USER_AGENT = 'Trezor Suite test';
const CONNECTION = { rpc: 'connection' };
const VALIDATOR = 'validatorAddress';

const txShim = {
    serializeMessage: jest.fn().mockReturnValue('solanaMessage'),
    serialize: jest.fn().mockReturnValue('solanaSerializedTx'),
    addSignature: jest.fn(),
};

const buildSolanaTxMeta = (overrides: Partial<SolanaTxMeta> = {}): SolanaTxMeta => ({
    deviceAmountLamports: '1000000000',
    feeLamports: '5000',
    rentLamports: '2282880',
    feeIncludingRentLamports: '2287880',
    hasSplitInstruction: false,
    ...overrides,
});

const preparedTx = (solanaTxMeta = buildSolanaTxMeta()): PrepareStakeSolTxResponse => ({
    success: true,
    txShim,
    solanaTxMeta,
});

const NORMAL_FEE_LEVEL: FeeLevel = {
    label: 'normal',
    blocks: -1,
    feePerUnit: '5000',
    feeLimit: '200000',
};

const CUSTOM_FEE_LEVEL: FeeLevel = { ...NORMAL_FEE_LEVEL, label: 'custom' };

const ESTIMATED_FEE_LEVEL = { feePerUnit: '5000', feeLimit: '200000', feePerTx: '5000' };

const buildComposeContext = (symbol: NetworkSymbol = SOL): ComposeActionContext => ({
    account: mockWalletAccount({
        symbol,
        descriptor: DESCRIPTOR,
        availableBalance: '10000000000',
    }),
    network: getNetwork(symbol),
    feeInfo: {
        blockHeight: 1,
        blockTime: 1,
        minFee: 1,
        maxFee: 100,
        minPriorityFee: 1,
        levels: [NORMAL_FEE_LEVEL, CUSTOM_FEE_LEVEL],
    },
});

const buildFormValues = (
    overrides: Partial<StakeFormState> & { amount?: string; stakeType?: StakeType } = {},
): StakeFormState => {
    const { amount = '1', stakeType = 'stake', ...rest } = overrides;

    return {
        outputs: [
            {
                address: DESCRIPTOR,
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

const blockchainEstimateFeeMock = TrezorConnect.blockchainEstimateFee as jest.Mock;

const compose = (formValues = buildFormValues(), composeContext = buildComposeContext()) =>
    composeSolanaStakingTransaction({
        formValues,
        composeContext,
        blockchainUrl: BLOCKCHAIN_URL,
        userAgent: USER_AGENT,
        source: '1',
    });

beforeEach(() => {
    jest.clearAllMocks();
    selectSolanaConnectionMock.mockReturnValue(CONNECTION);
    selectSolanaValidatorMock.mockReturnValue(VALIDATOR);
    prepareStakeSolTxMock.mockResolvedValue(preparedTx());
    prepareUnstakeSolTxMock.mockResolvedValue(preparedTx());
    prepareClaimSolTxMock.mockResolvedValue(preparedTx());
    blockchainEstimateFeeMock.mockResolvedValue({
        success: true,
        payload: { levels: [ESTIMATED_FEE_LEVEL] },
    });
});

describe('prepareSolanaStakeTxData', () => {
    const params = {
        from: DESCRIPTOR,
        symbol: SOL,
        amount: '1',
        blockchainUrl: BLOCKCHAIN_URL,
        userAgent: USER_AGENT,
        estimatedFee: ESTIMATED_FEE_LEVEL,
        source: '1',
    } as const;

    it('builds a stake transaction with the selected connection and validator', async () => {
        const result = await prepareSolanaStakeTxData({ ...params, stakeType: 'stake' });

        expect(selectSolanaConnectionMock).toHaveBeenCalledWith(BLOCKCHAIN_URL, USER_AGENT);
        expect(selectSolanaValidatorMock).toHaveBeenCalledWith(SOL);
        expect(prepareStakeSolTxMock).toHaveBeenCalledWith({
            from: DESCRIPTOR,
            amount: '1',
            connection: CONNECTION,
            validator: VALIDATOR,
            estimatedFee: ESTIMATED_FEE_LEVEL,
            source: '1',
        });
        expect(result).toEqual(preparedTx());
    });

    it('builds an unstake transaction', async () => {
        await prepareSolanaStakeTxData({ ...params, stakeType: 'unstake' });

        expect(prepareUnstakeSolTxMock).toHaveBeenCalledWith({
            from: DESCRIPTOR,
            amount: '1',
            connection: CONNECTION,
            validator: VALIDATOR,
            estimatedFee: ESTIMATED_FEE_LEVEL,
            source: '1',
        });
        expect(prepareStakeSolTxMock).not.toHaveBeenCalled();
    });

    it('builds a claim transaction without an amount or validator', async () => {
        await prepareSolanaStakeTxData({ ...params, stakeType: 'claim' });

        expect(prepareClaimSolTxMock).toHaveBeenCalledWith({
            from: DESCRIPTOR,
            connection: CONNECTION,
            estimatedFee: ESTIMATED_FEE_LEVEL,
        });
    });

    it('returns nothing for a stake type Solana does not support', async () => {
        const result = await prepareSolanaStakeTxData({ ...params, stakeType: 'change-delegate' });

        expect(result).toBeUndefined();
        expect(prepareStakeSolTxMock).not.toHaveBeenCalled();
        expect(prepareUnstakeSolTxMock).not.toHaveBeenCalled();
        expect(prepareClaimSolTxMock).not.toHaveBeenCalled();
    });
});

describe('composeSolanaStakingTransaction', () => {
    it.each(['', '0'])('returns nothing for the amount "%s"', async amount => {
        await expect(compose(buildFormValues({ amount }))).resolves.toBeUndefined();

        expect(prepareStakeSolTxMock).not.toHaveBeenCalled();
    });

    it('returns nothing for an account outside Solana staking', async () => {
        const result = await compose(
            buildFormValues(),
            buildComposeContext(asNetworkSymbol('eth')),
        );

        expect(result).toBeUndefined();
        expect(prepareStakeSolTxMock).not.toHaveBeenCalled();
    });

    it('composes the predefined fee levels with the estimated fee and rent', async () => {
        const result = await compose();

        expect(blockchainEstimateFeeMock).toHaveBeenCalledWith({
            coin: 'sol',
            request: {
                specific: { data: 'solanaSerializedTx', newAccountProgramName: 'staking' },
            },
        });
        expect(prepareStakeSolTxMock).toHaveBeenCalledTimes(2);
        expect(prepareStakeSolTxMock).toHaveBeenLastCalledWith(
            expect.objectContaining({ estimatedFee: ESTIMATED_FEE_LEVEL }),
        );
        expect(Object.keys(result ?? {})).toEqual(['normal']);
        expect(result?.normal).toMatchObject({
            type: 'final',
            fee: '2287880',
            totalSpent: '1002287880',
            feePerByte: '5000',
            feeLimit: '200000',
            solanaTxMeta: buildSolanaTxMeta(),
            isDeviceReviewOnly: false,
            outputs: [{ address: DESCRIPTOR, amount: '1000000000' }],
        });
    });

    it('estimates without the staking program when no stake account is created', async () => {
        prepareStakeSolTxMock.mockResolvedValue(
            preparedTx(buildSolanaTxMeta({ rentLamports: '0' })),
        );

        await compose();

        expect(blockchainEstimateFeeMock).toHaveBeenCalledWith({
            coin: 'sol',
            request: { specific: { data: 'solanaSerializedTx' } },
        });
    });

    it('marks every level for device review only when the transaction splits a stake', async () => {
        prepareUnstakeSolTxMock.mockResolvedValue(
            preparedTx(buildSolanaTxMeta({ hasSplitInstruction: true })),
        );

        const result = await compose(buildFormValues({ stakeType: 'unstake' }));

        expect(result?.normal).toMatchObject({ type: 'final', isDeviceReviewOnly: true });
    });

    it('reports a failed fee estimation on every level', async () => {
        blockchainEstimateFeeMock.mockResolvedValue({
            success: false,
            error: { message: 'estimate failed' },
        });

        const result = await compose();

        expect(prepareStakeSolTxMock).toHaveBeenCalledTimes(1);
        expect(result?.normal).toEqual({
            type: 'error',
            error: 'TR_STAKE_FEE_ESTIMATION_FAILED',
            errorMessage: { id: 'TR_STAKE_FEE_ESTIMATION_FAILED' },
        });
    });

    it('reports a failed transaction preparation as a failed fee estimation', async () => {
        prepareStakeSolTxMock.mockResolvedValue({ success: false, errorMessage: 'no validator' });

        const result = await compose();

        expect(blockchainEstimateFeeMock).not.toHaveBeenCalled();
        expect(result?.normal).toMatchObject({
            type: 'error',
            error: 'TR_STAKE_FEE_ESTIMATION_FAILED',
        });
    });

    it('rejects an amount the balance cannot cover with the fee', async () => {
        const result = await compose(buildFormValues({ amount: '10' }));

        expect(result?.normal).toEqual({
            type: 'error',
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
            errorMessage: {
                id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                values: { networkDisplaySymbol: 'SOL' },
            },
        });
    });
});
