// @group:suite
// @retry=2

import { urlSearchParams } from '@trezor/suite/src/utils/suite/metadata';
import { EventType, SuiteAnalyticsEvent } from '@trezor/suite-analytics';

type Requests = ReturnType<typeof urlSearchParams>[];
let requests: Requests;

describe('Assets', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();

        requests = [];
        cy.intercept({ hostname: 'data.trezor.io', url: '/suite/log/**' }, req => {
            const params = urlSearchParams(req.url);
            requests.push(params);
        });
    });

    it('checks that BTC and ETH accounts are available', () => {
        cy.prefixedVisit('/');

        // enable ethereum
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/eth').click();
        cy.getTestElement('@settings/menu/close').click();

        cy.passThroughInitialRun();

        // ugly bug which takes user to settings after initial run in case he was there before and had initialized device
        cy.getTestElement('@settings/menu/close').click();

        cy.discoveryShouldFinish();
        cy.contains('Bitcoin').should('be.visible');
        cy.contains('Ethereum').should('be.visible').click();

        cy.wrap(requests).then(requestsArr => {
            const selectWalletTypeEvent = requestsArr.find(
                req => req.c_type === EventType.SelectWalletType,
            ) as Extract<SuiteAnalyticsEvent, { type: EventType.SelectWalletType }>['payload'];

            expect(selectWalletTypeEvent.type).to.equal('standard');
        });

        cy.wrap(requests).then(requestsArr => {
            const accountsStatusEvent = requestsArr.find(
                req => req.c_type === EventType.AccountsStatus,
            ) as unknown as Extract<
                SuiteAnalyticsEvent,
                { type: EventType.AccountsStatus }
            >['payload'];

            expect(parseInt(accountsStatusEvent.btc_normal.toString(), 10)).to.not.equal(NaN);
            expect(parseInt(accountsStatusEvent.btc_taproot.toString(), 10)).to.not.equal(NaN);
            expect(parseInt(accountsStatusEvent.btc_segwit.toString(), 10)).to.not.equal(NaN);
            expect(parseInt(accountsStatusEvent.btc_legacy.toString(), 10)).to.not.equal(NaN);
            expect(parseInt(accountsStatusEvent.eth_normal.toString(), 10)).to.not.equal(NaN);
        });

        cy.wrap(requests).then(requestsArr => {
            const AccountsNonZeroBalanceEvent = requestsArr.find(
                req => req.c_type === EventType.AccountsNonZeroBalance,
            ) as unknown as Extract<
                SuiteAnalyticsEvent,
                { type: EventType.AccountsNonZeroBalance }
            >['payload'];

            // 0x73d0385F4d8E00C5e6504C6030F47BF6212736A8 has token and nobody will be able to move it without ETH
            expect(parseInt(AccountsNonZeroBalanceEvent.eth_normal.toString(), 10)).to.not.equal(
                NaN,
            );
        });

        cy.wrap(requests).then(requestsArr => {
            const accountsNonZeroBalanceEvent = requestsArr.find(
                req => req.c_type === EventType.AccountsNonZeroBalance,
            ) as unknown as Extract<
                SuiteAnalyticsEvent,
                { type: EventType.AccountsNonZeroBalance }
            >['payload'];

            // 0x73d0385F4d8E00C5e6504C6030F47BF6212736A8 has token and nobody will be able to move it without ETH
            expect(parseInt(accountsNonZeroBalanceEvent.eth_normal.toString(), 10)).to.not.equal(
                NaN,
            );
        });

        cy.wrap(requests).then(requestsArr => {
            const accountsTokensStatusEvent = requestsArr.find(
                req => req.c_type === EventType.AccountsTokensStatus,
            ) as unknown as Extract<
                SuiteAnalyticsEvent,
                { type: EventType.AccountsTokensStatus }
            >['payload'];

            // 0x73d0385F4d8E00C5e6504C6030F47BF6212736A8 has token and nobody will be able to move it without ETH
            expect(parseInt(accountsTokensStatusEvent.eth.toString(), 10)).to.not.equal(NaN);
        });
    });
});

export {};
