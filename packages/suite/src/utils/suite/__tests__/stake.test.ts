import TrezorConnect, { AccountInfo, Success, Unsuccessful } from '@trezor/connect';
import {
    transformTxFixtures,
    stakeFixture,
    stakeFailedFixture,
    unstakeFixture,
    unstakeFailedFixture,
    claimFixture,
    claimFailedFixture,
    getStakeFormsDefaultValuesFixture,
    getStakeTxGasLimitFixture,
    getUnstakingPeriodInDaysFixture,
    getDaysToAddToPoolFixture,
    getDaysToUnstakeFixture,
    getDaysToAddToPoolInitialFixture,
    getAdjustedGasLimitConsumptionFixture,
    getEthNetworkForWalletSdkFixture,
} from '../__fixtures__/stake';
import {
    transformTx,
    stake,
    unstake,
    claimWithdrawRequest,
    getStakeFormsDefaultValues,
    StakeTxBaseArgs,
    GetStakeFormsDefaultValuesParams,
    GetStakeTxGasLimitParams,
    getStakeTxGasLimit,
    getUnstakingPeriodInDays,
    getDaysToAddToPool,
    getDaysToUnstake,
    getDaysToAddToPoolInitial,
    getAdjustedGasLimitConsumption,
    getEthNetworkForWalletSdk,
} from '../stake';
import {
    BlockchainEstimatedFee,
    BlockchainEstimatedFeeLevel,
} from '@trezor/connect/src/types/api/blockchainEstimateFee';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { ValidatorsQueue } from '@suite-common/wallet-core';
import { NetworkSymbol } from 'src/types/wallet';

describe('transformTx', () => {
    transformTxFixtures.forEach(test => {
        it(test.description, () => {
            const result = transformTx(test.tx, test.gasPrice, test.nonce, test.chainId);
            expect(result).toEqual(test.result);
            expect(result).not.toHaveProperty('from');
        });
    });
});

type Result<T> = Unsuccessful | Success<T>;
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
    getStakeTxGasLimitFixture.forEach(test => {
        it(test.description, async () => {
            mockTrezorConnect(test);
            const result = await getStakeTxGasLimit(test.args as GetStakeTxGasLimitParams);
            expect(result).toEqual(test.result);
        });
    });
});

describe('getUnstakingPeriodInDays', () => {
    getUnstakingPeriodInDaysFixture.forEach(test => {
        it(test.description, async () => {
            const result = await getUnstakingPeriodInDays(test.args.validatorWithdrawTimeInSeconds);
            expect(result).toEqual(test.result);
        });
    });
});

type GetDaysArgs = {
    unstakeTxs: WalletAccountTransaction[];
    stakeTxs: WalletAccountTransaction[];
    validatorsQueue?: ValidatorsQueue;
};
describe('getDaysToAddToPool', () => {
    getDaysToAddToPoolFixture.forEach(test => {
        it(test.description, async () => {
            const { stakeTxs, validatorsQueue } = test.args as GetDaysArgs;
            mockCurrentTime(1720615417); // mock current time to 2024-07-10
            const result = await getDaysToAddToPool(stakeTxs, validatorsQueue);
            expect(result).toEqual(test.result);
        });
    });
});

describe('getDaysToUnstake', () => {
    getDaysToUnstakeFixture.forEach(test => {
        it(test.description, async () => {
            const { unstakeTxs, validatorsQueue } = test.args as GetDaysArgs;
            mockCurrentTime(1720615417); // mock current time to 2024-07-10
            const result = await getDaysToUnstake(unstakeTxs, validatorsQueue);
            expect(result).toEqual(test.result);
        });
    });
});

describe('getDaysToAddToPoolInitial', () => {
    getDaysToAddToPoolInitialFixture.forEach(test => {
        it(test.description, async () => {
            const { validatorsQueue } = test.args as GetDaysArgs;
            const result = await getDaysToAddToPoolInitial(validatorsQueue);
            expect(result).toEqual(test.result);
        });
    });
});

type GetAdjustedGasLimitConsumptionArgs = Success<BlockchainEstimatedFee>;

describe('getDaysToAddToPoolInitial', () => {
    getAdjustedGasLimitConsumptionFixture.forEach(test => {
        it(test.description, async () => {
            const result = await getAdjustedGasLimitConsumption(
                test.args.estimatedFee as GetAdjustedGasLimitConsumptionArgs,
            );
            expect(result).toEqual(test.result);
        });
    });
});

describe('getDaysToAddToPoolInitial', () => {
    getEthNetworkForWalletSdkFixture.forEach(test => {
        it(test.description, async () => {
            const result = await getEthNetworkForWalletSdk(test.args.symbol as NetworkSymbol);
            expect(result).toEqual(test.result);
        });
    });
});
