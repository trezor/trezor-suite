// @group:suite
// @retry=2

import { urlSearchParams } from '@trezor/suite/src/utils/suite/metadata';
import { EventType } from '@trezor/suite-analytics';

type Requests = ReturnType<typeof urlSearchParams>[];
let requests: Requests;
const instance = new RegExp(/^[A-Za-z0-9]{10,10}$/);
const timestamp = new RegExp(/^[0-9]{13,16}$/);

describe('Analytics', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();

        requests = [];
    });

    it('should respect disabled analytics in onboarding with following enabling in settings', () => {
        cy.intercept({ hostname: 'data.trezor.io', url: '/suite/log/**' }, req => {
            const params = urlSearchParams(req.url);
            requests.push(params);
        }).as('data-fetch');

        cy.prefixedVisit('/');

        // pass through onboarding with disabled analytics
        cy.getTestElement('@analytics/toggle-switch').find('input').should('be.checked');
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@analytics/toggle-switch').find('input').should('not.be.checked');
        cy.getTestElement('@onboarding/continue-button').click();

        // assert that only "analytics/dispose" event was fired
        cy.wait('@data-fetch');
        cy.wrap(requests).its(0).should('have.property', 'c_type', EventType.SettingsAnalytics);
        cy.wrap(requests).its(0).should('have.property', 'value', 'false');
        cy.wrap(requests).its(0).its('c_session_id').as('request0');
        cy.wrap(requests)
            .its(0)
            .should('have.property', 'c_timestamp')
            .should('match', timestamp)
            .as('timestamp0');
        cy.wrap(requests).should('have.length', 1);

        // finish onboarding
        cy.getTestElement('@onboarding/exit-app-button').click();

        // reload app (important, app needs time to save initialRun flag into storage) to change session id
        cy.getTestElement('@suite/loading').should('not.exist');
        cy.discoveryShouldFinish();
        cy.reload();
        cy.discoveryShouldFinish();

        // go to settings, analytics should not enabled and no additional analytics requests should be fired
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@analytics/toggle-switch').find('input').should('not.be.checked');
        cy.wrap(requests).should('have.length', 1);

        // enable analytics and check "analytics/enable" event was fired
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@analytics/toggle-switch').find('input').should('be.checked');
        cy.wait('@data-fetch');
        cy.wrap(requests).its(1).should('have.property', 'c_type', EventType.SettingsAnalytics);
        cy.wrap(requests).its(1).its('c_session_id').as('request1');
        cy.wrap(requests)
            .its(1)
            .should('have.property', 'c_timestamp')
            .should('match', timestamp)
            .as('timestamp1');
        cy.wrap(requests).should('have.length', 2);

        // check that timestamp changes between requests
        cy.get('@timestamp0').then(t0 => {
            cy.get('@timestamp1').then(t1 => {
                expect(t1).not.to.equal(t0);
            });
        });

        // check that session ids changed after reload;
        cy.get('@request0').then(r0 => {
            cy.get('@request1').then(r1 => {
                expect(r1).not.to.equal(r0);
            });
        });

        // change fiat and check that it was logged
        cy.getTestElement('@settings/fiat-select/input').click({ force: true });
        cy.getTestElement('@settings/fiat-select/option/huf').click({ force: true });
        cy.wait('@data-fetch');
        cy.wrap(requests)
            .its(2)
            .should('have.property', 'c_type', EventType.SettingsGeneralChangeFiat);
        cy.wrap(requests).its(2).should('have.property', 'fiat', 'huf');
        cy.wrap(requests).its(2).should('have.property', 'c_instance_id').should('match', instance);
        cy.wrap(requests).should('have.length', 3);

        // open device modal and check that it was logged
        cy.getTestElement('@menu/switch-device').click();
        cy.wait('@data-fetch');
        cy.wrap(requests).its(3).should('have.property', 'c_type', EventType.RouterLocationChange);
        cy.wrap(requests).should('have.length', 4);
    });

    it('should respect enabled analytics in onboarding with following disabling in settings', () => {
        cy.intercept({ hostname: 'data.trezor.io', url: '/suite/log/**' }, req => {
            const params = urlSearchParams(req.url);
            requests.push(params);
        }).as('data-fetch');

        cy.prefixedVisit('/');

        // pass through onboarding with enabled analytics
        cy.getTestElement('@analytics/toggle-switch').find('input').should('be.checked');
        cy.getTestElement('@onboarding/continue-button').click();

        // assert that more than 1 event was fired and it was "suite/ready" and "analytics/enable" for sure
        cy.wait('@data-fetch');
        cy.wrap(requests).its('length').should('be.gt', 1);
        cy.wrap(requests)
            .then(list => Cypress._.map(list, 'c_type'))
            .should('include', EventType.SuiteReady);
        cy.wrap(requests)
            .then(list => Cypress._.map(list, 'c_type'))
            .should('include', EventType.SettingsAnalytics);

        // finish onboarding
        cy.getTestElement('@onboarding/exit-app-button').click();

        // go to settings, analytics should be enabled
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@analytics/toggle-switch').find('input').should('be.checked');

        // disable analytics
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@analytics/toggle-switch').find('input').should('not.be.checked');

        // change fiat
        cy.getTestElement('@settings/fiat-select/input').click({ force: true });
        cy.getTestElement('@settings/fiat-select/option/huf').click({ force: true });
        cy.wait('@data-fetch');
        cy.wrap(requests).its('length').as('length1');

        // check that analytics disable event was fired
        cy.wrap(requests)
            .then(list => Cypress._.map(list, 'c_type'))
            .should('include', EventType.SettingsAnalytics);
        cy.wrap(requests).its('length').as('length0');

        // check that "settings/general/change-fiat" event was not fired
        cy.get('@length0').then(l0 => {
            cy.get('@length1').then(l1 => {
                expect(l1).to.equal(l0);
            });
        });
    });
});
