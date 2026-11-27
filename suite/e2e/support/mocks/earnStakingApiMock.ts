import { type Page } from '@playwright/test';

import type {
    AdaPools,
    EthOrSolStats,
    EthValidatorsQueue,
    TrxStats,
} from '@suite-common/earn-staking-api';

import { step } from '../common';
import { TRON_REPRESENTATIVE_STATS } from './tronEarnApiMock';

const ETH_STATS_URL = /\/staking\/v1\/eth\/stats/;
const ETH_VALIDATORS_QUEUE_URL = /\/staking\/v1\/eth\/validators-queue/;
const SOL_STATS_URL = /\/staking\/v1\/sol\/stats/;
const ADA_POOLS_URL = /\/staking\/v1\/ada\/pools/;
const TRX_STATS_URL = /\/staking\/v1\/trx\/stats/;

const SECONDS_IN_DAY = 24 * 60 * 60;

type EthStats = Extract<EthOrSolStats, { symbol: 'eth' }>;
type SolStats = Extract<EthOrSolStats, { symbol: 'sol' }>;

export const CARDANO_EVERSTAKE_POOL_ID = 'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj';

// Mocks the per-product staking API endpoints the product info is fetched from, behind every rate
// and period. A spec sets the fields it asserts before it enables its networks, which refreshes the
// product info; the routes read them on each request.
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

        // The app fetched the product info when its products registered, before these routes
        // existed: the page fixture loads it before any other fixture runs. Reloading on the
        // initial screen repeats that start with the routes in place and discards whatever the
        // first load got from the real API.
        await this.page.reload();
    }
}
