// @group:suite
// @retry=2

import { urlSearchParams } from '../../../../../suite/src/utils/suite/metadata';

type Requests = ReturnType<typeof urlSearchParams>[];
const requests: Requests = [];

const onBeforeLoad = (requests: Requests) => (win: Window) => {
    cy.stub(win, 'fetch', function (url, options) {
        // @ts-ignore
        win.Math.random = () => 0.4; // to make tests deterministic, this value ensures state YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
        if (url.startsWith('https://data.trezor.io/suite/log')) {
            const params = urlSearchParams(url);
            requests.push(params);
        }
        return fetch(url, options);
    });
};

describe('Analytics', () => {
    beforeEach(function () {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('stopEmu');
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
    });

    it('Analytics should be enabled on initial run, then user may disable it and this option should be respected on subsequent reloads', function () {
        // cy.request('https://data.trezor.io/suite/log/web/develop.log').as('log');

        cy.prefixedVisit('/', {
            onBeforeLoad: onBeforeLoad(requests),
        });

        // pass through initial run
        cy.getTestElement('@welcome/continue-button').click();
        cy.getTestElement('@analytics/toggle-switch').should('be.checked');
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@analytics/toggle-switch').should('not.be.checked');
        cy.getTestElement('@analytics/go-to-onboarding-button').click();
        cy.getTestElement('@onboarding/skip-button').click();
        cy.getTestElement('@onboarding/skip-button').click();

        // NOTE: this will fail on localhost as analytics does not run there
        // assert that only 1 request was fired
        cy.wrap(requests).its(0).its('c_session_id').as('request0');
        cy.wrap(requests).its(0).should('have.property', 'c_type', 'initial-run-completed');
        cy.wrap(requests).its(0).should('have.property', 'analytics', 'false');
        cy.wrap(requests).its(0).should('have.property', 'c_instance_id', 'YYYYYYYYYY');
        cy.wrap(requests).its(1).should('equal', undefined);

        // important, suite needs time to save initialRun flag into storage
        cy.getTestElement('@suite/loading').should('not.exist');

        // go to settings
        cy.prefixedVisit('/settings', {
            onBeforeLoad: onBeforeLoad(requests),
        });
        cy.getTestElement('@modal/connect-device');
        cy.task('startEmu', { wipe: false });
        cy.getTestElement('@modal/connect-device').should('not.be.visible');

        // analytics is not enabled and no additional requests were fired
        cy.getTestElement('@analytics/toggle-switch').should('not.be.checked');
        cy.wrap(requests).its(0).should('have.property', 'c_type', 'initial-run-completed');
        cy.wrap(requests).its(0).should('have.property', 'analytics', 'false');
        cy.wrap(requests).its(1).should('equal', undefined);

        // enable it and reload page
        cy.log('enable it again, reload and see it remains checked');
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@analytics/toggle-switch').should('be.checked');
        cy.wrap(requests).its(1).should('have.property', 'c_type', 'analytics/enable');

        // change fiat
        cy.getTestElement('@settings/fiat-select/input').click();
        cy.getTestElement('@settings/fiat-select/option/huf').click({ force: true });

        // NOTE: this will fail on localhost as analytics does not run there
        // check that fiat change got logged.

        cy.wrap(requests).its(2).its('c_session_id').as('request1');
        cy.wrap(requests).its(2).should('have.property', 'c_type', 'settings/general/change-fiat');
        cy.wrap(requests).its(2).should('have.property', 'c_instance_id', 'YYYYYYYYYY');
        cy.wrap(requests).its(2).should('have.property', 'fiat', 'huf');
        // and check that session ids changed after reload;
        cy.get('@request0').then(r0 => {
            cy.get('@request1').then(r1 => {
                expect(r1).not.to.equal(r0);
            });
        });

        // opening device modal
        cy.getTestElement('@menu/switch-device').click();
        cy.wrap(requests).its(4).should('have.property', 'c_type', 'menu/goto/switch-device');

        // adding wallet
        cy.getTestElement('@switch-device/add-wallet-button').click();
        cy.wrap(requests).its(5).should('have.property', 'c_type', 'switch-device/add-wallet');
    });
});
