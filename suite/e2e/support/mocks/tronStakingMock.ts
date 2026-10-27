import type { Page } from '@playwright/test';

import type { ReportStakingTxIds, TrxStatsItem } from '@suite-common/earn-staking-api';
import type { TronResourceType } from '@suite-common/wallet-types';
import type {
    BlockbookTransaction,
    TronStakingInfo,
    TronVote,
} from '@trezor/blockchain-link-types';

import { step } from '../common';
import { BlockbookMock } from './blockBookMock';
import {
    TRON_BEST_HEIGHT,
    TRON_EMPTY_STAKING_INFO,
    TRON_MOCKED_ACCOUNT,
    mockTronResources,
    mockTronTransaction,
} from './tron-endpoints';

const TRX_STATS_URL = '**/staking/v1/trx/stats';
const REPORT_URL = '**/staking/v1/report';
const SUN_PER_TRX = 1_000_000;
const TRON_UNFREEZE_DELAY_SECONDS = 14 * 24 * 60 * 60;

export const trxToSun = (amount: number) => String(amount * SUN_PER_TRX);

export const TRON_REPRESENTATIVES = {
    luganodes: {
        address: 'TGyrSc9ZmTdbYziuk1SKEmdtCdETafewJ9',
        name: 'LugaNodes',
        url: 'https://www.luganodes.com',
        apr: 4.12,
    },
    p2pOrg: {
        address: 'TH7Fe1W8CcLeqN4LGfqX1R9EpsnrJBQJij',
        name: 'P2P.org',
        url: 'https://p2p.org',
        apr: 3.87,
    },
} as const satisfies Record<string, TrxStatsItem>;

export const TRON_STAKING_TXIDS = {
    freeze: 'f'.repeat(64),
    vote: '1'.repeat(64),
    unfreeze: '2'.repeat(64),
    withdraw: '3'.repeat(64),
    claim: '4'.repeat(64),
} as const;

type ResourceOperationParams = { amount: number; resource: TronResourceType };

const STAKED_BALANCE_KEY = {
    bandwidth: 'stakedBalanceBandwidth',
    energy: 'stakedBalanceEnergy',
} as const satisfies Record<TronResourceType, keyof TronStakingInfo>;

export class TronStakingMock {
    readonly reportedTransactions: ReportStakingTxIds[] = [];
    private balance = Number(TRON_MOCKED_ACCOUNT.balance);
    private transactions: BlockbookTransaction[] = [...(TRON_MOCKED_ACCOUNT.transactions ?? [])];
    private stakingInfo: TronStakingInfo = TRON_EMPTY_STAKING_INFO;
    private blockHeight = TRON_BEST_HEIGHT;

    constructor(
        private readonly page: Page,
        private readonly blockbookMock: BlockbookMock,
    ) {}

    get url() {
        return this.blockbookMock.url;
    }

    @step()
    async start() {
        await this.blockbookMock.start('trx');
        await this.page
            .context()
            .route(TRX_STATS_URL, route =>
                route.fulfill({ json: Object.values(TRON_REPRESENTATIVES) }),
            );
        await this.page.context().route(REPORT_URL, async route => {
            this.reportedTransactions.push(route.request().postDataJSON());
            await route.fulfill({ json: {} });
        });
    }

    @step()
    async stop() {
        await this.page.context().unroute(TRX_STATS_URL);
        await this.page.context().unroute(REPORT_URL);
    }

    @step()
    setStakingInfo(stakingInfo: Partial<TronStakingInfo>) {
        this.stakingInfo = { ...this.stakingInfo, ...stakingInfo };
        this.syncAccountState();
    }

    @step()
    setNextBroadcastTxid(txid: string) {
        this.blockbookMock.setBroadcastTxid(txid);
    }

    @step()
    confirmFreeze({ amount, resource }: ResourceOperationParams) {
        const amountSun = amount * SUN_PER_TRX;
        const stakedBalanceKey = STAKED_BALANCE_KEY[resource];

        this.balance -= amountSun;
        this.stakingInfo = {
            ...this.stakingInfo,
            stakedBalance: String(Number(this.stakingInfo.stakedBalance) + amountSun),
            [stakedBalanceKey]: String(Number(this.stakingInfo[stakedBalanceKey]) + amountSun),
            totalVotingPower: String(Number(this.stakingInfo.totalVotingPower) + amount),
            availableVotingPower: String(Number(this.stakingInfo.availableVotingPower) + amount),
        };
        this.addConfirmedTransaction(TRON_STAKING_TXIDS.freeze, {
            contractType: 'FreezeBalanceV2Contract',
            operation: 'freeze',
            resource: resource.toUpperCase(),
            stakeAmount: String(amountSun),
            totalFee: '0',
            result: 'SUCCESS',
        });
    }

    @step()
    confirmVote(votes: TronVote[]) {
        const votedPower = votes.reduce((sum, vote) => sum + Number(vote.voteCount), 0);

        this.stakingInfo = {
            ...this.stakingInfo,
            votes,
            availableVotingPower: String(Number(this.stakingInfo.totalVotingPower) - votedPower),
        };
        this.addConfirmedTransaction(TRON_STAKING_TXIDS.vote, {
            contractType: 'VoteWitnessContract',
            operation: 'vote',
            votes: votes.map(vote => ({ address: vote.address, count: vote.voteCount })),
            totalFee: '0',
            result: 'SUCCESS',
        });
    }

    @step()
    confirmUnfreeze({ amount, resource }: ResourceOperationParams) {
        const amountSun = amount * SUN_PER_TRX;
        const stakedBalanceKey = STAKED_BALANCE_KEY[resource];
        const nowSeconds = Math.floor(Date.now() / 1000);

        this.stakingInfo = {
            ...this.stakingInfo,
            stakedBalance: String(Number(this.stakingInfo.stakedBalance) - amountSun),
            [stakedBalanceKey]: String(Number(this.stakingInfo[stakedBalanceKey]) - amountSun),
            totalVotingPower: String(Number(this.stakingInfo.totalVotingPower) - amount),
            availableVotingPower: String(Number(this.stakingInfo.availableVotingPower) - amount),
            unstakingBatches: [
                ...this.stakingInfo.unstakingBatches,
                { amount: String(amountSun), expireTime: nowSeconds + TRON_UNFREEZE_DELAY_SECONDS },
            ],
        };
        this.addConfirmedTransaction(
            TRON_STAKING_TXIDS.unfreeze,
            {
                contractType: 'UnfreezeBalanceV2Contract',
                operation: 'unfreeze',
                resource: resource === 'energy' ? resource : undefined,
                unstakeAmount: String(amountSun),
                totalFee: '0',
                result: 'SUCCESS',
            },
            nowSeconds,
        );
    }

    @step()
    confirmWithdraw() {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const isExpired = (batch: TronStakingInfo['unstakingBatches'][number]) =>
            batch.expireTime <= nowSeconds;
        const withdrawnSun = this.stakingInfo.unstakingBatches
            .filter(isExpired)
            .reduce((sum, batch) => sum + Number(batch.amount), 0);

        this.balance += withdrawnSun;
        this.stakingInfo = {
            ...this.stakingInfo,
            unstakingBatches: this.stakingInfo.unstakingBatches.filter(batch => !isExpired(batch)),
        };
        this.addConfirmedTransaction(TRON_STAKING_TXIDS.withdraw, {
            contractType: 'WithdrawExpireUnfreezeContract',
            operation: 'withdraw',
            unstakeAmount: String(withdrawnSun),
            totalFee: '0',
            result: 'SUCCESS',
        });
    }

    @step()
    confirmClaim() {
        const claimedSun = this.stakingInfo.unclaimedReward;

        this.balance += Number(claimedSun);
        this.stakingInfo = {
            ...this.stakingInfo,
            unclaimedReward: '0',
            latestWithdrawTime: Math.floor(Date.now() / 1000),
        };
        this.addConfirmedTransaction(TRON_STAKING_TXIDS.claim, {
            contractType: 'WithdrawBalanceContract',
            operation: 'claim',
            claimedVoteReward: claimedSun,
            totalFee: '0',
            result: 'SUCCESS',
        });
    }

    private addConfirmedTransaction(
        txid: string,
        payload: NonNullable<BlockbookTransaction['chainExtraData']>['payload'],
        blockTime?: number,
    ) {
        this.blockHeight += 1;
        this.transactions = [
            mockTronTransaction({ txid, blockHeight: this.blockHeight, blockTime, payload }),
            ...this.transactions,
        ];
        this.syncAccountState();
    }

    private syncAccountState() {
        this.blockbookMock.updateAccountState({
            balance: String(this.balance),
            txs: this.transactions.length,
            transactions: this.transactions,
            chainExtraData: {
                payloadType: 'tron',
                payload: mockTronResources({ stakingInfo: this.stakingInfo }),
            },
        });
    }
}
