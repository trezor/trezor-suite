import { type EthValidatorsQueue } from '@suite-common/earn-staking-api';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import TrezorConnect, {
    type AccountInfo,
    type InternalTransfer,
    type OkWithDevice,
} from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import {
    type BlockchainEstimatedFee,
    type BlockchainEstimatedFeeLevel,
} from '@trezor/connect-common/src/types/api/blockchain/blockchainEstimateFee';
import { type Err, type Ok, type Result } from '@trezor/type-utils';

import {
    type GetStakeFormsDefaultValuesParams,
    type GetStakeTxGasLimitParams,
    type StakeTxBaseArgs,
} from '../types';
import {
    claimFailedFixture,
    claimFixture,
    getAdjustedGasLimitConsumptionFixture,
    getChangedInternalTxFixture,
    getDaysToAddToPoolFixture,
    getDaysToAddToPoolInitialFixture,
    getDaysToUnstakeFixture,
    getEthNetworkForWalletSdkFixture,
    getInstantStakeTypeFixture,
    getStakeFormsDefaultValuesFixture,
    getStakeTxGasLimitFixture,
    simulateUnstakeFixture,
    stakeFailedFixture,
    stakeFixture,
    transformTxFixtures,
    unstakeFailedFixture,
    unstakeFixture,
} from './__fixtures__/ethereumStaking';
import {
    buildStakeData,
    buildUnstakeData,
    claimWithdrawRequest,
    getAdjustedGasLimitConsumption,
    getChangedInternalTx,
    getDaysToAddToPool,
    getDaysToAddToPoolInitial,
    getDaysToUnstake,
    getEthNetworkForWalletSdk,
    getInstantStakeType,
    getStakeFormsDefaultValues,
    getStakeTxGasLimit,
    getUnstakeAmountFromCalldata,
    simulateUnstake,
    stake,
    transformTx,
    unstake,
    validateEthereumClaimLiveState,
    validateEthereumUnstakeLiveState,
    verifyEthereumStakingLiveState,
} from './ethereumStaking';

describe('transformTx', () => {
    transformTxFixtures.forEach(test => {
        it(test.description, () => {
            const result = transformTx(test.tx, test.nonce, test.chainId, test.gasPrice);
            expect(result).toEqual(test.result);
            expect(result).not.toHaveProperty('from');
        });
    });
});

type AccountInfoResult = Result<(AccountInfo | null)[]>;
type EstimateFeeResult = Result<BlockchainEstimatedFeeLevel>;

const mockTrezorConnect = (test: Record<string, any>) => {
    const { accountInfo, estimatedFee } = test;
    if (!accountInfo && !estimatedFee) return null;
    if (accountInfo) {
        jest.spyOn(TrezorConnect, 'getAccountInfo').mockImplementation(() =>
            Promise.resolve(accountInfo as AccountInfoResult),
        );
    }
    if (estimatedFee) {
        jest.spyOn(TrezorConnect, 'blockchainEstimateFee').mockImplementation(() =>
            Promise.resolve(estimatedFee as EstimateFeeResult),
        );
    }
};

const mockCurrentTime = (timestampInSeconds: number) => {
    jest.spyOn(Date, 'now').mockImplementation(() => timestampInSeconds * 1000);
};

type StakeTxArgs = StakeTxBaseArgs & { amount: string };

describe('stake', () => {
    stakeFixture.forEach(test => {
        it(test.description, async () => {
            mockTrezorConnect(test);
            const result = await stake(test.args as StakeTxArgs);
            expect(result).toEqual(test.result);
        });
    });
    stakeFailedFixture.forEach(test => {
        it(test.description, async () => {
            mockTrezorConnect(test);
            await expect(stake(test.args as StakeTxArgs)).rejects.toThrow(test.result);
        });
    });
});

type UnstakeTxArgs = StakeTxBaseArgs & {
    amount: string;
    interchanges: number;
};

describe('unstake', () => {
    unstakeFixture.forEach(test => {
        it(test.description, async () => {
            mockTrezorConnect(test);
            const result = await unstake(test.args as UnstakeTxArgs);
            expect(result).toEqual(test.result);
        });
    });
    unstakeFailedFixture.forEach(test => {
        it(test.description, async () => {
            mockTrezorConnect(test);
            await expect(unstake(test.args as UnstakeTxArgs)).rejects.toThrow(test.result);
        });
    });
});

describe('claim', () => {
    claimFixture.forEach(test => {
        it(test.description, async () => {
            mockTrezorConnect(test);
            const result = await claimWithdrawRequest(test.args as StakeTxBaseArgs);
            expect(result).toEqual(test.result);
        });
    });
    claimFailedFixture.forEach(test => {
        it(test.description, async () => {
            mockTrezorConnect(test);
            await expect(claimWithdrawRequest(test.args as StakeTxBaseArgs)).rejects.toThrow(
                test.result,
            );
        });
    });
});

describe('getStakeFormsDefaultValues', () => {
    getStakeFormsDefaultValuesFixture.forEach(test => {
        it(test.description, () => {
            expect(
                getStakeFormsDefaultValues(test.args as GetStakeFormsDefaultValuesParams),
            ).toEqual(test.result);
        });
    });
});

describe('getStakeTxGasLimit', () => {
    beforeAll(() => {
        const originalError = console.error;

        jest.spyOn(console, 'error').mockImplementation((...args) => {
            const errorMessage = args[0];

            if (typeof errorMessage === 'object') {
                return;
            }

            originalError(...args);
        });
    });

    getStakeTxGasLimitFixture.forEach(test => {
        it(test.description, async () => {
            mockTrezorConnect(test);
            const result = await getStakeTxGasLimit(test.args as GetStakeTxGasLimitParams);
            expect(result).toEqual(test.result);
        });
    });
});

type GetDaysArgs = {
    unstakeTxs: WalletAccountTransaction[];
    stakeTxs: WalletAccountTransaction[];
    validatorsQueue?: EthValidatorsQueue;
};
describe('getDaysToAddToPool', () => {
    getDaysToAddToPoolFixture.forEach(test => {
        it(test.description, () => {
            const { stakeTxs, validatorsQueue } = test.args as GetDaysArgs;
            mockCurrentTime(1720615417); // mock current time to 2024-07-10
            const result = getDaysToAddToPool(stakeTxs, validatorsQueue);
            expect(result).toEqual(test.result);
        });
    });
});

describe('getDaysToUnstake', () => {
    getDaysToUnstakeFixture.forEach(test => {
        it(test.description, () => {
            const { unstakeTxs, validatorsQueue } = test.args as GetDaysArgs;
            mockCurrentTime(1720615417); // mock current time to 2024-07-10
            const result = getDaysToUnstake(unstakeTxs, validatorsQueue);
            expect(result).toEqual(test.result);
        });
    });
});

describe('getDaysToAddToPoolInitial', () => {
    getDaysToAddToPoolInitialFixture.forEach(test => {
        it(test.description, () => {
            const { validatorsQueue } = test.args as GetDaysArgs;
            const result = getDaysToAddToPoolInitial(validatorsQueue);
            expect(result).toEqual(test.result);
        });
    });
});

type GetAdjustedGasLimitConsumptionArgs = Ok<BlockchainEstimatedFee>;

describe('getAdjustedGasLimitConsumption', () => {
    getAdjustedGasLimitConsumptionFixture.forEach(test => {
        it(test.description, () => {
            const result = getAdjustedGasLimitConsumption(
                test.args.estimatedFee as GetAdjustedGasLimitConsumptionArgs,
            );
            expect(result).toEqual(test.result);
        });
    });
});

describe('getEthNetworkForWalletSdk', () => {
    getEthNetworkForWalletSdkFixture.forEach(test => {
        it(test.description, () => {
            const result = getEthNetworkForWalletSdk(test.args.symbol);
            expect(result).toEqual(test.result);
        });
    });
});

describe('getInstantStakeType', () => {
    getInstantStakeTypeFixture.forEach(test => {
        it(test.description, () => {
            const result = getInstantStakeType(
                test.args.internalTransfer as InternalTransfer,
                test.args.address,
                test.args.symbol,
            );
            expect(result).toEqual(test.result);
        });
    });
});

describe('getChangedInternalTx', () => {
    getChangedInternalTxFixture.forEach(test => {
        it(test.description, async () => {
            const result = await getChangedInternalTx(
                test.args.prevTxs as WalletAccountTransaction[],
                test.args.currentTxs as WalletAccountTransaction[],
                test.args.selectedAccountAddress,
                test.args.symbol,
            );
            expect(result).toEqual(test.result);
        });
    });
});

type BlockchainEvmRpcCallResult = Err<SerializedError> | OkWithDevice<{ data: string }>;
type SimulateUnstakeArgs = StakeTxBaseArgs & { amount: string };

describe('simulateUnstake', () => {
    simulateUnstakeFixture.forEach(test => {
        it(test.description, async () => {
            jest.spyOn(TrezorConnect, 'blockchainEvmRpcCall').mockImplementation(() =>
                Promise.resolve(test.blockchainEvmRpcCallResult as BlockchainEvmRpcCallResult),
            );
            const result = await simulateUnstake(test.args as SimulateUnstakeArgs);
            expect(result).toEqual(test.result);
        });
    });
});

describe('validateEthereumUnstakeLiveState', () => {
    it('is valid when the autocompound balance covers the requested amount', () => {
        expect(
            validateEthereumUnstakeLiveState({ autocompoundBalance: '2000000000000000000' }, '1.5'),
        ).toEqual({ isValid: true });
    });

    it('is invalid when the autocompound balance is missing', () => {
        expect(validateEthereumUnstakeLiveState({}, '1.5')).toEqual({
            isValid: false,
            error: 'Failed to get the autocompound balance',
        });
        expect(validateEthereumUnstakeLiveState(undefined, '1.5')).toEqual({
            isValid: false,
            error: 'Failed to get the autocompound balance',
        });
    });

    it('is invalid when the requested amount exceeds the live balance', () => {
        expect(
            validateEthereumUnstakeLiveState({ autocompoundBalance: '100000000000000' }, '0.1'),
        ).toEqual({ isValid: false, error: 'Max Amount For Unstake 0.0001' });
    });
});

describe('validateEthereumClaimLiveState', () => {
    it('is valid when the withdraw request is fully filled', () => {
        expect(
            validateEthereumClaimLiveState({
                withdrawTotalAmount: '100000000000000000',
                claimableAmount: '100000000000000000',
            }),
        ).toEqual({ isValid: true });
    });

    it('is invalid when the withdraw or claimable amount is missing', () => {
        expect(
            validateEthereumClaimLiveState({ withdrawTotalAmount: '100000000000000000' }),
        ).toEqual({
            isValid: false,
            error: 'Failed to get the claimable or withdraw total amount',
        });
    });

    it('is invalid when nothing has been requested for unstake', () => {
        expect(
            validateEthereumClaimLiveState({ withdrawTotalAmount: '0', claimableAmount: '0' }),
        ).toEqual({ isValid: false, error: 'No amount requested for unstake' });
    });

    it('is invalid when the withdraw request is not fully filled yet', () => {
        expect(
            validateEthereumClaimLiveState({
                withdrawTotalAmount: '200000000000000000',
                claimableAmount: '100000000000000000',
            }),
        ).toEqual({ isValid: false, error: 'Unstake request not filled yet' });
    });
});

describe('getUnstakeAmountFromCalldata', () => {
    it('recovers the ether amount encoded in unstake calldata', () => {
        expect(getUnstakeAmountFromCalldata(buildUnstakeData('1500000000000000000', 5))).toBe(
            '1.5',
        );
    });

    it('returns null for calldata that is not an unstake call', () => {
        expect(getUnstakeAmountFromCalldata(buildStakeData())).toBeNull();
        expect(getUnstakeAmountFromCalldata('0x1234')).toBeNull();
    });
});

describe('verifyEthereumStakingLiveState', () => {
    const mockAccountInfo = (accountInfo: Record<string, any>) =>
        jest
            .spyOn(TrezorConnect, 'getAccountInfo')
            .mockImplementation(() => Promise.resolve(accountInfo as AccountInfoResult));

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('is valid for stake without fetching account info', async () => {
        const spy = mockAccountInfo({ success: true, payload: {} });
        spy.mockClear();

        const result = await verifyEthereumStakingLiveState({
            stakeType: 'stake',
            from: '0xabc',
            symbol: 'eth',
        });

        expect(result).toEqual({ isValid: true });
        expect(spy).not.toHaveBeenCalled();
    });

    it('is valid for unstake when the live balance still covers the amount', async () => {
        mockAccountInfo({
            success: true,
            payload: {
                misc: { stakingPools: [{ autocompoundBalance: '2000000000000000000' }] },
            },
        });

        const result = await verifyEthereumStakingLiveState({
            stakeType: 'unstake',
            from: '0xabc',
            symbol: 'eth',
            amount: '1.5',
        });

        expect(result).toEqual({ isValid: true });
    });

    it('is invalid for unstake when the live balance dropped below the amount', async () => {
        mockAccountInfo({
            success: true,
            payload: {
                misc: { stakingPools: [{ autocompoundBalance: '100000000000000' }] },
            },
        });

        const result = await verifyEthereumStakingLiveState({
            stakeType: 'unstake',
            from: '0xabc',
            symbol: 'eth',
            amount: '0.1',
        });

        expect(result).toEqual({ isValid: false, error: 'Max Amount For Unstake 0.0001' });
    });

    it('is invalid for unstake when the amount is not provided', async () => {
        mockAccountInfo({
            success: true,
            payload: {
                misc: { stakingPools: [{ autocompoundBalance: '2000000000000000000' }] },
            },
        });

        const result = await verifyEthereumStakingLiveState({
            stakeType: 'unstake',
            from: '0xabc',
            symbol: 'eth',
        });

        expect(result).toEqual({
            isValid: false,
            error: 'Missing unstake amount for live-state validation',
        });
    });

    it('is invalid for claim when the withdraw request is not yet filled', async () => {
        mockAccountInfo({
            success: true,
            payload: {
                misc: {
                    stakingPools: [
                        {
                            withdrawTotalAmount: '200000000000000000',
                            claimableAmount: '100000000000000000',
                        },
                    ],
                },
            },
        });

        const result = await verifyEthereumStakingLiveState({
            stakeType: 'claim',
            from: '0xabc',
            symbol: 'eth',
        });

        expect(result).toEqual({ isValid: false, error: 'Unstake request not filled yet' });
    });

    it('is invalid when account info cannot be fetched', async () => {
        mockAccountInfo({ success: false, error: { message: 'Account info error' } });

        const result = await verifyEthereumStakingLiveState({
            stakeType: 'claim',
            from: '0xabc',
            symbol: 'eth',
        });

        expect(result).toEqual({ isValid: false, error: 'Account info error' });
    });
});
