/* eslint-disable @typescript-eslint/camelcase */

// @group:onboarding
// @retry=2

describe('Onboarding - steps order', () => {
    before(() => {
        cy.task('stopEmu');
    });

    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        cy.getTestElement('@onboarding/begin-button').click();
    });

    describe('New device', () => {
        beforeEach(() => {
            cy.getTestElement('@onboarding/path-create-button').click();
        });

        it('No device connected -> offer device selection', () => {
            cy.getTestElement('@onboarding/path-new-button').click();
            cy.getTestElement('@onboarding/option-model-one-path');
        });

        it('Device is already connected -> skip device selection and go to hologram directly', () => {
            cy.connectDevice({ firmware: 'none' }, { firmware_present: false });
            cy.getTestElement('@onboarding/path-new-button').click();
            cy.getTestElement('@onboarding/hologram/hologram-different-button');
        });
    });

    describe('Used device', () => {
        beforeEach(() => {
            cy.getTestElement('@onboarding/path-create-button').click();
        });

        it('No device connected -> skip device selection, skip hologram and go to pair device step directly', () => {
            cy.getTestElement('@onboarding/path-used-button').click();
            cy.getTestElement('@onboarding/pair-device-step');
        });
    });

    describe('Back buttons', () => {
        it('back buttons', () => {
            cy.getTestElement('@onboarding/path-create-button').click();
            cy.getTestElement('@onboarding/back-button').click();
            cy.getTestElement('@onboarding/path-create-button').click();

            cy.getTestElement('@onboarding/path-new-button').click();
            cy.getTestElement('@onboarding/back-button').click();
            cy.getTestElement('@onboarding/path-used-button').click();
            cy.getTestElement('@onboarding/back-button').click();
            cy.getTestElement('@onboarding/path-new-button').click();

            cy.getTestElement('@onboarding/option-model-one-path').click();
            cy.getTestElement('@onboarding/back-button').click();
            cy.getTestElement('@onboarding/option-model-t-path').click();
            cy.getTestElement('@onboarding/back-button').click();
            cy.getTestElement('@onboarding/option-model-t-path').click();
        });
    });
});
