import { type Page } from '@playwright/test';

import { LUGANODES_TRON_SRS, P2P_ORG_TRON_SRS } from '@suite-common/wallet-config';

import { step } from '../common';

const STATS_URL = /\/staking\/v1\/trx\/stats/;
const REPORT_URL = /\/staking\/v1\/report/;

export type TronRepresentativeStats = {
    address: string;
    name: string;
    url: string;
    apr: number;
};

export type ReportedStakingTxId = {
    txid: string;
    network: string;
    kind: string;
};

export const TRON_LUGANODES_ADDRESS = LUGANODES_TRON_SRS[0] as string;
export const TRON_P2P_ADDRESS = P2P_ORG_TRON_SRS[0] as string;

// Mocks the Earn API used by the Tron staking flows: the representative list with APRs the vote
// step is built from, and the endpoint the vote txid is reported to.
export class TronEarnApiMock {
    readonly representatives: TronRepresentativeStats[] = [
        {
            address: TRON_LUGANODES_ADDRESS,
            name: 'Luganodes',
            url: 'https://luganodes.com',
            apr: 4.2,
        },
        { address: TRON_P2P_ADDRESS, name: 'P2P.org', url: 'https://p2p.org', apr: 3.8 },
    ];
    readonly reportedTxIds: ReportedStakingTxId[] = [];

    constructor(private readonly page: Page) {}

    @step()
    async start() {
        await this.page.route(STATS_URL, route => route.fulfill({ json: this.representatives }));
        await this.page.route(REPORT_URL, route => {
            this.reportedTxIds.push(route.request().postDataJSON());

            return route.fulfill({ json: {} });
        });
    }
}
