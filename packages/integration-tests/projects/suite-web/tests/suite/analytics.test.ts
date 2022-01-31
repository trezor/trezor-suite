// @group:suite
// @retry=2

import { urlSearchParams } from '../../../../../suite/src/utils/suite/metadata';

type Requests = ReturnType<typeof urlSearchParams>[];
const requests: Requests = [];
const instance = new RegExp(/^[A-Za-z0-9]{10,10}$/);
const timestamp = new RegExp(/^[0-9]{13,16}$/);

describe('Analytics', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
    });

    it('Analytics should be enabled on initial run, then user may disable it and this option should be respected on subsequent reloads', () => {
        /*
         * Skip test on localhost as analytics is disabled on location.hostname === "localhost". See getUrl function.
         * TODO: Build app with test flag, modify getUrl function to return test url and mock this test url.
         */
        cy.skipOn('localhost');

        cy.intercept({ hostname: 'data.trezor.io', url: '/suite/log/**' }, req => {
            const params = urlSearchParams(req.url);
            requests.push(params);
        }).as('data-fetch');

        cy.prefixedVisit('/');

        // pass through initial run
        cy.getTestElement('@analytics/toggle-switch').should('be.checked');
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@analytics/toggle-switch').should('not.be.checked');
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/exit-app-button').click();

        // assert that only 2 requests was fired
        cy.wait('@data-fetch');
        cy.wrap(requests).its(0).should('have.property', 'c_type', 'analytics/dispose');
        cy.wrap(requests).its(1).its('c_session_id').as('request0');
        cy.wrap(requests).its(1).should('have.property', 'c_type', 'initial-run-completed');
        cy.wrap(requests)
            .its(1)
            .should('have.property', 'c_timestamp')
            .should('match', timestamp)
            .as('timestamp0');
        cy.wrap(requests).its(1).should('have.property', 'analytics', 'false');
        cy.wrap(requests).its(2).should('equal', undefined);

        // important, suite needs time to save initialRun flag into storage
        cy.getTestElement('@suite/loading').should('not.exist');
        cy.discoveryShouldFinish();

        // go to settings
        cy.prefixedVisit('/');
        cy.task('startEmu', { wipe: false });
        cy.discoveryShouldFinish();
        cy.getTestElement('@suite/menu/settings').click();

        // analytics is not enabled and no additional requests were fired
        cy.getTestElement('@analytics/toggle-switch').should('not.be.checked');
        cy.wrap(requests).its(0).should('have.property', 'c_type', 'analytics/dispose');
        cy.wrap(requests).its(1).should('have.property', 'c_type', 'initial-run-completed');
        cy.wrap(requests).its(1).should('have.property', 'analytics', 'false');
        cy.wrap(requests).its(2).should('equal', undefined);

        // enable it and reload page
        cy.log('enable it again, reload and see it remains checked');
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@analytics/toggle-switch').should('be.checked');
        cy.wait('@data-fetch');
        cy.wrap(requests).its(2).should('have.property', 'c_type', 'analytics/enable');
        cy.wrap(requests)
            .its(2)
            .should('have.property', 'c_timestamp')
            .should('match', timestamp)
            .as('timestamp1');
        // check that timestamp changes between requests
        cy.get('@timestamp0').then(t0 => {
            cy.get('@timestamp1').then(t1 => {
                expect(t1).not.to.equal(t0);
            });
        });

        // change fiat
        cy.getTestElement('@settings/fiat-select/input').click({ force: true });
        cy.getTestElement('@settings/fiat-select/option/huf').click({ force: true });

        // check that fiat change got logged.

        cy.wait('@data-fetch');
        cy.wrap(requests).its(3).its('c_session_id').as('request1');
        cy.wrap(requests).its(3).should('have.property', 'c_type', 'settings/general/change-fiat');
        cy.wrap(requests).its(3).should('have.property', 'fiat', 'huf');
        cy.wrap(requests).its(3).should('have.property', 'c_instance_id').should('match', instance);
        // and check that session ids changed after reload;
        cy.get('@request0').then(r0 => {
            cy.get('@request1').then(r1 => {
                expect(r1).not.to.equal(r0);
            });
        });

        // opening device modal
        cy.getTestElement('@menu/switch-device').click();
        cy.wait('@data-fetch');
        cy.wrap(requests).its(5).should('have.property', 'c_type', 'menu/goto/switch-device');

        // adding wallet
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.wait('@data-fetch');
        cy.wrap(requests)
            .its(6)
            .should('have.property', 'c_type', 'switch-device/add-hidden-wallet');
    });
});
