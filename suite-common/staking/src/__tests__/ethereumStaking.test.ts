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
} from '@trezor/connect-common/src/types/api/blockchainEstimateFee';
import { type Err, type Ok, type Result } from '@trezor/type-utils';

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
} from '../__fixtures__/ethereumStaking';
import {
    type GetStakeFormsDefaultValuesParams,
    type GetStakeTxGasLimitParams,
    type StakeTxBaseArgs,
} from '../types';
import {
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
    simulateUnstake,
    stake,
    transformTx,
    unstake,
} from '../utils/ethereumStaking';

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
