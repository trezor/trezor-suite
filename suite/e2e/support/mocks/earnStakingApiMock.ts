import { type Page } from '@playwright/test';

import type {
    AdaPools,
    EthOrSolStats,
    EthValidatorsQueue,
    StakingBatch,
    TrxStats,
} from '@suite-common/earn-staking-api';

import { step } from '../common';
import { TRON_REPRESENTATIVE_STATS } from './tronEarnApiMock';

const BATCH_URL = /\/staking\/v1\/\?networks=/;
const ETH_STATS_URL = /\/staking\/v1\/eth\/stats/;
const ETH_VALIDATORS_QUEUE_URL = /\/staking\/v1\/eth\/validators-queue/;
const SOL_STATS_URL = /\/staking\/v1\/sol\/stats/;
const ADA_POOLS_URL = /\/staking\/v1\/ada\/pools/;
const TRX_STATS_URL = /\/staking\/v1\/trx\/stats/;

const SECONDS_IN_DAY = 24 * 60 * 60;

type EthStats = Extract<EthOrSolStats, { symbol: 'eth' }>;
type SolStats = Extract<EthOrSolStats, { symbol: 'sol' }>;

export const CARDANO_EVERSTAKE_POOL_ID = 'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj';

// Mocks the staking API behind every rate and period: the per-product endpoints the product info is
// fetched from, and the batch endpoint the legacy slice keeps polling until the read side is removed.
// A spec sets the fields it asserts before the app loads; the routes read them on each request.
export class EarnStakingApiMock {
    ethStats: EthStats = { symbol: 'eth', apy: 1, nextRewardPayout: 1 };
    ethValidatorsQueue: EthValidatorsQueue = {
        activationTime: 0,
        addingDelay: SECONDS_IN_DAY,
        exitTime: 0,
        withdrawTime: 3 * SECONDS_IN_DAY,
    };
    solStats: SolStats = { symbol: 'sol', apy: 7 };
    adaPools: AdaPools['pools'] = [{ apy: 3.9, saturation: 50, id: CARDANO_EVERSTAKE_POOL_ID }];
    trxStats: TrxStats = [...TRON_REPRESENTATIVE_STATS];

    constructor(private readonly page: Page) {}

    @step()
    async start() {
        await this.page.route(ETH_STATS_URL, route => route.fulfill({ json: this.ethStats }));
        await this.page.route(ETH_VALIDATORS_QUEUE_URL, route =>
            route.fulfill({ json: this.ethValidatorsQueue }),
        );
        await this.page.route(SOL_STATS_URL, route => route.fulfill({ json: this.solStats }));
        await this.page.route(ADA_POOLS_URL, route =>
            route.fulfill({ json: { pools: this.adaPools } satisfies AdaPools }),
        );
        await this.page.route(TRX_STATS_URL, route => route.fulfill({ json: this.trxStats }));
        await this.page.route(BATCH_URL, route => route.fulfill({ json: this.getBatch() }));
    }

    private getBatch(): StakingBatch {
        const { apy, nextRewardPayout } = this.ethStats;

        return {
            data: [
                {
                    symbol: 'eth',
                    stats: { apy, nextRewardPayout },
                    validators: this.ethValidatorsQueue,
                },
                { symbol: 'sol', stats: { apy: this.solStats.apy } },
                { symbol: 'ada', pools: this.adaPools },
                { symbol: 'trx', representatives: this.trxStats },
            ],
            errors: [],
        };
    }
}
