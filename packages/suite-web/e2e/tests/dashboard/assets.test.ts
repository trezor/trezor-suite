// @group:suite
// @retry=2

import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType, Requests } from '../../support/types';

let requests: Requests;

describe('Assets', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();

        requests = [];
        cy.interceptDataTrezorIo(requests);
    });

    it('checks that BTC and ETH accounts are available', () => {
        cy.prefixedVisit('/');

        // enable ethereum
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/eth').click();
        cy.getTestElement('@settings/menu/close').click();

        cy.passThroughInitialRun();
        cy.getTestElement('@suite/menu/suite-index').click();

        cy.discoveryShouldFinish();
        cy.contains('Bitcoin').should('be.visible');
        cy.contains('Ethereum').should('be.visible').click();

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.SelectWalletType>>(
            requests,
            EventType.SelectWalletType,
        ).then(selectWalletTypeEvent => {
            expect(selectWalletTypeEvent.type).to.equal('standard');
        });

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.AccountsStatus>>(
            requests,
            EventType.AccountsStatus,
        ).then(accountsStatusEvent => {
            expect(parseInt(accountsStatusEvent.btc_normal.toString(), 10)).to.not.equal(NaN);
            expect(parseInt(accountsStatusEvent.btc_taproot.toString(), 10)).to.not.equal(NaN);
            expect(parseInt(accountsStatusEvent.btc_segwit.toString(), 10)).to.not.equal(NaN);
            expect(parseInt(accountsStatusEvent.btc_legacy.toString(), 10)).to.not.equal(NaN);
            expect(parseInt(accountsStatusEvent.eth_normal.toString(), 10)).to.not.equal(NaN);
        });

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.AccountsNonZeroBalance>>(
            requests,
            EventType.AccountsNonZeroBalance,
        ).then(accountsNonZeroBalanceEvent => {
            // 0x73d0385F4d8E00C5e6504C6030F47BF6212736A8 has token and nobody will be able to move it without ETH
            expect(parseInt(accountsNonZeroBalanceEvent.eth_normal.toString(), 10)).to.not.equal(
                NaN,
            );
        });

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.AccountsTokensStatus>>(
            requests,
            EventType.AccountsTokensStatus,
        ).then(accountsTokensStatusEvent => {
            // 0x73d0385F4d8E00C5e6504C6030F47BF6212736A8 has token and nobody will be able to move it without ETH
            expect(parseInt(accountsTokensStatusEvent.eth.toString(), 10)).to.not.equal(NaN);
        });
    });
});

export {};
