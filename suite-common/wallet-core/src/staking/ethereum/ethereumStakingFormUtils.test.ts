import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type ComposeActionContext,
    type StakeFormState,
    type StakeType,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';

import { getStakeFormsDefaultValuesFixture } from './__fixtures__/ethereumStaking';
import {
    addEthereumStakingGasReserve,
    composeEthereumStakingTransaction,
    getStakeFormsDefaultValues,
} from './ethereumStakingFormUtils';
import { buildStakeData, buildUnstakeData } from './providers/everstake/everstakeCalldata';
import {
    STAKE_GAS_LIMIT_RESERVE,
    UNSTAKE_INTERCHANGES,
} from './providers/everstake/everstakeConstants';
import { type GetStakeFormsDefaultValuesParams } from './types';
import { WALLET_SDK_SOURCE, WALLET_SDK_SOURCE_MOBILE } from '../shared/stakingConstants';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        blockchainEstimateFee: jest.fn(),
        getAccountInfo: jest.fn(),
    },
}));

const ETH = asNetworkSymbol('eth');
const POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';
const ESTIMATED_GAS_LIMIT = 21000;
const GAS_LIMIT = String(ESTIMATED_GAS_LIMIT + STAKE_GAS_LIMIT_RESERVE);

const NORMAL_FEE_LEVEL: FeeLevel = { label: 'normal', blocks: -1, feePerUnit: '20' };
const HIGH_FEE_LEVEL: FeeLevel = { label: 'high', blocks: -1, feePerUnit: '40' };
const CUSTOM_FEE_LEVEL: FeeLevel = { label: 'custom', blocks: -1, feePerUnit: '1' };

const composeContext: ComposeActionContext = {
    account: mockWalletAccount({
        symbol: ETH,
        descriptor: asAccountDescriptor('0xfffffffffffffffffffffffffffffffffffffffe'),
        availableBalance: '5000000000000000000',
    }),
    network: getNetwork(ETH),
    feeInfo: {
        blockHeight: 1,
        blockTime: 12,
        minFee: 1,
        maxFee: 100,
        minPriorityFee: 1,
        levels: [NORMAL_FEE_LEVEL, HIGH_FEE_LEVEL, CUSTOM_FEE_LEVEL],
    },
};

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

const blockchainEstimateFeeMock = TrezorConnect.blockchainEstimateFee as jest.Mock;
const getAccountInfoMock = TrezorConnect.getAccountInfo as jest.Mock;

const compose = (formValues = buildFormValues(), source = WALLET_SDK_SOURCE) =>
    composeEthereumStakingTransaction({ formValues, composeContext, source });

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    blockchainEstimateFeeMock.mockResolvedValue({
        success: true,
        payload: { levels: [{ feeLimit: String(ESTIMATED_GAS_LIMIT) }] },
    });
    getAccountInfoMock.mockResolvedValue({
        success: true,
        payload: { misc: { stakingPools: [{ autocompoundBalance: '2000000000000000000' }] } },
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('composeEthereumStakingTransaction', () => {
    it.each(['', '0'])('returns nothing for the amount "%s"', async amount => {
        await expect(compose(buildFormValues({ amount }))).resolves.toBeUndefined();

        expect(blockchainEstimateFeeMock).not.toHaveBeenCalled();
    });

    it('estimates gas with the stake calldata and carries it on every level', async () => {
        const result = await compose();

        expect(blockchainEstimateFeeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                coin: 'eth',
                request: expect.objectContaining({
                    specific: expect.objectContaining({
                        from: composeContext.account.descriptor,
                        to: POOL_ADDRESS,
                        data: buildStakeData(),
                    }),
                }),
            }),
        );
        expect(Object.keys(result ?? {})).toEqual(['normal', 'high']);
        expect(result?.normal).toMatchObject({
            type: 'final',
            feeLimit: GAS_LIMIT,
            estimatedFeeLimit: GAS_LIMIT,
            feePerByte: '20',
            transactionData: buildStakeData(),
            outputs: [{ address: POOL_ADDRESS, amount: '1000000000000000000' }],
        });
        expect(result?.high).toMatchObject({
            type: 'final',
            feePerByte: '40',
            transactionData: buildStakeData(),
        });
    });

    it('attributes the calldata to the composing app', async () => {
        const result = await compose(buildFormValues(), WALLET_SDK_SOURCE_MOBILE);

        expect(result?.normal).toMatchObject({
            transactionData: buildStakeData(WALLET_SDK_SOURCE_MOBILE),
        });
    });

    it('carries the unstake calldata with the requested amount', async () => {
        const result = await compose(buildFormValues({ stakeType: 'unstake', amount: '1.5' }));

        expect(result?.normal).toMatchObject({
            type: 'final',
            transactionData: buildUnstakeData('1500000000000000000', UNSTAKE_INTERCHANGES),
        });
    });

    it('appends the custom level from the form when it is selected', async () => {
        const result = await compose(
            buildFormValues({
                selectedFee: 'custom',
                feePerUnit: '5',
                feeLimit: '300000',
                maxFeePerGas: '6',
                maxPriorityFeePerGas: '',
            }),
        );

        expect(Object.keys(result ?? {})).toEqual(['normal', 'high', 'custom']);
        expect(result?.custom).toMatchObject({
            type: 'final',
            feePerByte: '5',
            feeLimit: '300000',
            maxFeePerGas: '6',
            maxPriorityFeePerGas: '0',
            transactionData: buildStakeData(),
        });
    });

    it('returns the gas estimation failure as compose error levels', async () => {
        blockchainEstimateFeeMock.mockResolvedValue({
            success: false,
            error: { message: 'estimate failed' },
        });

        const result = await compose();

        expect(result).toEqual({
            normal: {
                type: 'error',
                error: 'INCORRECT-FEE-RATE',
                errorMessage: { id: 'TR_GENERIC_ERROR_TITLE' },
            },
        });
    });

    it('returns the generic error when the plan is rejected', async () => {
        const result = await compose(buildFormValues({ amount: '0.001' }));

        expect(result).toEqual({
            normal: {
                type: 'error',
                error: 'INCORRECT-FEE-RATE',
                errorMessage: { id: 'TR_GENERIC_ERROR_TITLE' },
            },
        });
        expect(blockchainEstimateFeeMock).not.toHaveBeenCalled();
    });

    it('returns the generic error for a stake type Ethereum does not support', async () => {
        const result = await compose(buildFormValues({ stakeType: 'change-delegate' }));

        expect(result?.normal).toMatchObject({ type: 'error', error: 'INCORRECT-FEE-RATE' });
    });

    it('leaves error levels without calldata', async () => {
        const result = await compose(buildFormValues({ amount: '10' }));

        expect(result?.normal).toEqual({
            type: 'error',
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
            errorMessage: {
                id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                values: { networkDisplaySymbol: 'ETH' },
            },
        });
    });
});

describe(addEthereumStakingGasReserve.name, () => {
    it('adds the reserve to the estimated limit, rounded down', () => {
        expect(addEthereumStakingGasReserve('20000', STAKE_GAS_LIMIT_RESERVE)).toBe(240000);
        expect(addEthereumStakingGasReserve('0', STAKE_GAS_LIMIT_RESERVE)).toBe(
            STAKE_GAS_LIMIT_RESERVE,
        );
    });

    it('is NaN when the estimate is missing', () => {
        expect(addEthereumStakingGasReserve(undefined, STAKE_GAS_LIMIT_RESERVE)).toBeNaN();
    });
});

describe(getStakeFormsDefaultValues.name, () => {
    getStakeFormsDefaultValuesFixture.forEach(test => {
        it(test.description, () => {
            expect(
                getStakeFormsDefaultValues(test.args as GetStakeFormsDefaultValuesParams),
            ).toEqual(test.result);
        });
    });
});
