import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StakingPool } from '@trezor/blockchain-link-types';
import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';

import {
    getEthereumCryptoBalanceWithStaking,
    getEthereumStakingContractAddress,
    hasStakeInPendingDepositedState,
} from './ethereumStakingUtils';

const everstakePool: StakingPool = {
    name: 'Everstake',
    contract: EVERSTAKE_CONTRACTS[1].accounting,
    autocompoundBalance: '2000000000000000000',
    claimableAmount: '0',
    depositedBalance: '2000000000000000000',
    pendingBalance: '100000000000000000',
    pendingDepositedBalance: '0',
    restakedReward: '0',
    withdrawTotalAmount: '500000000000000000',
};

const ethereumAccount = (stakingPools: StakingPool[] | undefined): Account =>
    ({
        ...mockWalletAccount({ symbol: asNetworkSymbol('eth'), formattedBalance: '1.5' }),
        networkType: 'ethereum',
        misc: { nonce: '0', stakingPools },
    }) as Account;

describe(getEthereumCryptoBalanceWithStaking.name, () => {
    it('adds the pooled positions to the account balance', () => {
        expect(getEthereumCryptoBalanceWithStaking(ethereumAccount([everstakePool]))).toBe('4.1');
    });

    it('is the account balance without positions', () => {
        expect(getEthereumCryptoBalanceWithStaking(ethereumAccount(undefined))).toBe('1.5');
    });

    it('ignores a pool of an unknown contract', () => {
        const unknownPool = {
            ...everstakePool,
            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
        };

        expect(getEthereumCryptoBalanceWithStaking(ethereumAccount([unknownPool]))).toBe('1.5');
    });
});

describe(hasStakeInPendingDepositedState.name, () => {
    it('is true once the whole pending stake awaits activation', () => {
        const pool = { ...everstakePool, pendingBalance: '0', pendingDepositedBalance: '100' };

        expect(hasStakeInPendingDepositedState(ethereumAccount([pool]))).toBe(true);
    });

    it('is false while part of the pending stake still waits in the pool', () => {
        const pool = { ...everstakePool, pendingBalance: '1', pendingDepositedBalance: '100' };

        expect(hasStakeInPendingDepositedState(ethereumAccount([pool]))).toBe(false);
    });

    it('is false without a pending deposit or without a position', () => {
        expect(hasStakeInPendingDepositedState(ethereumAccount([everstakePool]))).toBe(false);
        expect(hasStakeInPendingDepositedState(ethereumAccount(undefined))).toBe(false);
        expect(
            hasStakeInPendingDepositedState(mockWalletAccount({ symbol: asNetworkSymbol('btc') })),
        ).toBe(false);
    });
});

describe(getEthereumStakingContractAddress.name, () => {
    it('resolves the step target of the default provider before the account has a position', () => {
        expect(getEthereumStakingContractAddress(ethereumAccount(undefined), 'stake')).toBe(
            EVERSTAKE_CONTRACTS[1].pool,
        );
        expect(getEthereumStakingContractAddress(ethereumAccount(undefined), 'claim')).toBe(
            EVERSTAKE_CONTRACTS[1].accounting,
        );
    });

    it('is empty for an operation Ethereum providers do not have', () => {
        expect(
            getEthereumStakingContractAddress(ethereumAccount(undefined), 'change-delegate'),
        ).toBe('');
    });
});
