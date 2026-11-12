import { stakingAmountSchema } from '@suite-common/earn-staking-common';

import { type EverstakePoolDeployment } from './deployments';
import { createEthereumEverstakePooledProductLimits } from './limits';

const createDeployment = (minStakeAmount: string): EverstakePoolDeployment => ({
    poolAddress: '0xD523794C879D9eC028960a231F866758e405bE34',
    minStakeAmount: stakingAmountSchema.parse(minStakeAmount),
});

describe('createEthereumEverstakePooledProductLimits', () => {
    it('keeps the legacy limits in wei around the mainnet minimum', () => {
        expect(
            createEthereumEverstakePooledProductLimits(createDeployment('10000000000000000')),
        ).toEqual({
            minStakeAmount: '10000000000000000',
            maxStakeAmount: '1000000000000000000000000',
            minWithdrawalAmount: '5000000000000000',
            feeBufferBalance: '5000000000000000',
            minBalanceForStaking: '15000000000000000',
            minStakeAmountForDashboard: '10000000000000000',
            registrationDeposit: '0',
        });
    });

    it('derives the minimum balance and the dashboard minimum from the pool minimum', () => {
        expect(
            createEthereumEverstakePooledProductLimits(createDeployment('100000000000000000')),
        ).toEqual({
            minStakeAmount: '100000000000000000',
            maxStakeAmount: '1000000000000000000000000',
            minWithdrawalAmount: '5000000000000000',
            feeBufferBalance: '5000000000000000',
            minBalanceForStaking: '105000000000000000',
            minStakeAmountForDashboard: '100000000000000000',
            registrationDeposit: '0',
        });
    });
});
