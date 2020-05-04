/* eslint-disable @typescript-eslint/camelcase */

describe('Onboarding - steps order', () => {
    before(() => {
        cy.task('stopEmu');
    });

    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.visit('')
            .goToOnboarding()
            .onboardingShouldLoad()
            .getTestElement('@onboarding/begin-button')
            .click();
    });

    describe('New device', () => {
        beforeEach(() => {
            cy.getTestElement('@onboarding/path-create-button').click();
        });

        it('No device connected -> offer device selection', () => {
            cy.getTestElement('@onboarding/path-new-button')
                .click()
                .getTestElement('@onboarding/option-model-one-path');
        });

        it('Device is already connected -> skip device selection and go to hologram directly', () => {
            cy.connectDevice({ firmware: 'none' }, { firmware_present: false })
                .getTestElement('@onboarding/path-new-button')
                .click()
                .getTestElement('@onboarding/button-hologram-different');
        });
    });

    describe('Used device', () => {
        beforeEach(() => {
            cy.getTestElement('@onboarding/path-create-button').click();
        });

        it('No device connected -> skip device selection, skip hologram and go to pair device step directly', () => {
            cy.getTestElement('@onboarding/path-used-button')
                .click()
                .getTestElement('@onboarding/pair-device-step');
        });
    });
});
