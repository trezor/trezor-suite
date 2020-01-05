/* eslint-disable @typescript-eslint/camelcase */

describe('Onboarding happy paths', () => {
    before(() => {
        cy.task('startBridge')
            .task('startEmu')
            .task('wipeEmu')
            .task('stopEmu');
    });

    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    // after(() => {
    //     cy.task('stopBridge').task('stopEmu');
    // });

    it('this is just example how to use setState command', () => {
        cy.visit('/').onboardingShouldLoad();
        // @ts-ignore
        cy.setState({ onboarding: { activeStepId: 'backup' } });
        cy.connectDevice({ mode: 'normal' }, { initialized: true, needs_backup: true });
        cy.get('html').should('contain', 'Backup');
    });

    it(`create new wallet - skip security - appear in wallet`, () => {
        cy.visit('/');

        cy.onboardingShouldLoad()
            .getTestElement('@onboarding/button-path-create')
            .click()
            // todo: add snapshots in distance future when everything is stable
            // .matchImageSnapshot()
            .get('html')
            .should('contain', 'New device')
            .getTestElement('@onboarding/button-used-path')
            .click()
            .getTestElement('@onboarding/pair-device-step');

        cy.task('startEmu');

        cy.getTestElement('@onboarding/button-continue')
            .click()
            .get('html')
            .should('contain', 'Get the latest firmware')
            .getTestElement('@onboarding/button-continue')
            .click()
            .get('html')
            .should('contain', 'Seed type')
            .getTestElement('@onboarding/button-standard-backup')
            .click()
            .getTestElement('@onboading/confirm-action-on-device')
            .should('be.visible');
        cy.task('sendDecision', 'resetDevice');

        cy.get('html')
            .should('contain', 'Take me to security')
            .getTestElement('button-exit-app')
            .click();
    });
});
