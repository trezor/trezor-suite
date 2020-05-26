/* eslint-disable @typescript-eslint/camelcase */

describe('Onboarding - steps order', () => {
    before(() => {
        cy.task('stopEmu');
    });

    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.visit('/')
        cy.goToOnboarding()
        cy.onboardingShouldLoad()
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
            cy.connectDevice({ firmware: 'none' }, { firmware_present: false })
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
});
