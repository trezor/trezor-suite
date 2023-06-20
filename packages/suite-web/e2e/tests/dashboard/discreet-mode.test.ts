// @group:suite
// @retry=2

import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType, Requests } from '../../support/types';

let requests: Requests;

describe('Dashboard', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();

        requests = [];
        cy.interceptDataTrezorIo(requests);
    });

    /*
     * 1. navigate to 'Dashboard' page
     * 2. scroll to Security checks section
     * 3. Enable discreet mode
     * 4. check that status of Discreet mode
     */
    it('Discreet mode checkbox', () => {
        const discreetPartialClass = 'HiddenPlaceholder';

        cy.discoveryShouldFinish();
        cy.getTestElement('@dashboard/security-card/discreet/button').click();

        cy.getTestElement('@wallet/coin-balance/value-btc')
            .parent()
            .parent()
            .invoke('attr', 'class')
            .then(className => {
                expect(className).to.contain(discreetPartialClass);
            });

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.MenuToggleDiscreet>>(
            requests,
            EventType.MenuToggleDiscreet,
        ).then(menuToggleDiscreetEvent => {
            expect(menuToggleDiscreetEvent.value).to.equal('true');
        });
    });
});

export {};
