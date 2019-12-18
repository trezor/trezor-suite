/* eslint-disable @typescript-eslint/camelcase */

describe('Steps order - slightly differs under certain circumstances', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.visit('').onboardingShouldLoad();
    });

    describe('new device', () => {
        beforeEach(() => {
            cy.getTestElement('@onboarding/button-path-create').click();
        });

        it('no device connected -> offer device selection', () => {
            cy.getTestElement('@onboarding/button-new-path')
                .click()
                .getTestElement('@onboarding/option-model-one-path');
        });

        it('device is already connected -> skip device selection and go to hologram directly', () => {
            cy.connectDevice({ firmware: 'none' }, { firmware_present: false })
                .getTestElement('@onboarding/button-new-path')
                .click()
                .getTestElement('@onboarding/button-hologram-different');
        });
    });

    describe('used device', () => {
        beforeEach(() => {
            cy.getTestElement('@onboarding/button-path-create').click();
        });

        it('no device connected -> skip device selection, skip hologram and go to pair device step directly', () => {
            cy.getTestElement('@onboarding/button-used-path')
                .click()
                .getTestElement('@onboarding/pair-device-step');
        });
    });
});
