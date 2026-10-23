import { LUGANODES_TRON_SRS, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { type TronStakingInfo } from '@trezor/blockchain-link-types';
import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';

import {
    getMaxStakeAmountFixture,
    getUnstakingPeriodInDaysFixture,
} from './__fixtures__/stakingUtils';
import {
    getLegacyStakingDataForNetwork,
    getMaxStakeAmount,
    getStakingLimitsByNetworkSymbol,
    getStakingProvidersForAnalytics,
    getUnstakingPeriodInDays,
    isStakingTransaction,
} from './stakingUtils';
import { TRON_STAKING_LIMITS } from '../tron/tronStakingConstants';

describe('getUnstakingPeriodInDays', () => {
    getUnstakingPeriodInDaysFixture.forEach(test => {
        it(test.description, () => {
            const result = getUnstakingPeriodInDays(test.args.networkType, test.args.ethereumStats);
            expect(result).toEqual(test.result);
        });
    });
});

describe('getMaxStakeAmount', () => {
    getMaxStakeAmountFixture.forEach(test => {
        it(test.description, () => {
            const result = getMaxStakeAmount({
                balance: test.args.balance,
                symbol: test.args.symbol,
            });
            expect(result).toEqual(test.result);
        });
    });
});

const createEthereumStakingAccount = (contract: string): Account =>
    ({
        symbol: 'eth',
        networkType: 'ethereum',
        misc: {
            stakingPools: [
                {
                    name: 'Everstake',
                    contract,
                    autocompoundBalance: '1000000000000000000',
                    claimableAmount: '0',
                    depositedBalance: '1000000000000000000',
                    pendingBalance: '0',
                    pendingDepositedBalance: '0',
                    restakedReward: '0',
                    withdrawTotalAmount: '0',
                },
            ],
        },
    }) as unknown as Account;

describe(getStakingProvidersForAnalytics.name, () => {
    it('identifies an Ethereum pool by its accounting contract', () => {
        const account = createEthereumStakingAccount(
            EVERSTAKE_CONTRACTS[1].accounting.toLowerCase(),
        );

        expect(getStakingProvidersForAnalytics([account])).toEqual(['everstake']);
    });

    it('does not count a pool of an unknown contract as staking', () => {
        const account = createEthereumStakingAccount('0x624087DD1904ab122A32878Ce9e933C7071F53B9');

        expect(getStakingProvidersForAnalytics([account])).toEqual([]);
    });
});

const createTronStakingAccount = (stakingInfo?: Partial<TronStakingInfo>): Account =>
    ({
        symbol: asNetworkSymbol('trx'),
        networkType: 'tron',
        formattedBalance: '0',
        misc: { tronResources: { stakingInfo } },
    }) as unknown as Account;

describe('Tron staking through the product adapter', () => {
    it('reads the legacy staking data from the positions', () => {
        const [luganodesSr = ''] = LUGANODES_TRON_SRS;
        const account = createTronStakingAccount({
            stakedBalance: '100000000',
            votes: [{ address: luganodesSr, voteCount: '60' }],
            unstakingBatches: [{ amount: '8000000', expireTime: 1 }],
            unclaimedReward: '2000000',
        });

        expect(getLegacyStakingDataForNetwork(account)).toEqual({
            autocompoundBalance: '100',
            claimableAmount: '',
            depositedBalance: '100',
            pendingBalance: '',
            pendingDepositedBalance: '',
            totalPendingStakeBalance: '',
            restakedReward: '2',
            withdrawTotalAmount: '8',
            canClaim: false,
        });
    });

    it('keeps the empty staked balance of an account without staking info', () => {
        expect(getLegacyStakingDataForNetwork(createTronStakingAccount())).toMatchObject({
            autocompoundBalance: '',
            depositedBalance: '',
            restakedReward: '0',
            withdrawTotalAmount: '0',
        });
    });

    it('takes the limits and the unstaking period from the adapter', () => {
        expect(getStakingLimitsByNetworkSymbol(asNetworkSymbol('trx'))).toBe(TRON_STAKING_LIMITS);
        expect(getUnstakingPeriodInDays('tron')).toBe(14);
    });

    it('recognizes Tron staking transactions', () => {
        const transaction = (contractType: string) =>
            ({ tronSpecific: { contractType } }) as unknown as WalletAccountTransaction;

        expect(isStakingTransaction(transaction('VoteWitnessContract'))).toBe(true);
        expect(isStakingTransaction(transaction('TransferContract'))).toBe(false);
    });
});
