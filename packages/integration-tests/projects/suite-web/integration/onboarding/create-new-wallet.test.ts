/* eslint-disable @typescript-eslint/camelcase */

describe('Onboarding happy paths', () => {
    const DEVICE_PATH = '1';

    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it('this is just example how to use setState command', () => {
        cy.visit('/').onboardingShouldLoad();
        // @ts-ignore
        cy.setState({ onboarding: { activeStepId: 'backup' } });
        cy.connectDevice({ mode: 'normal' }, { initialized: true, needs_backup: true });
        cy.get('html').should('contain', 'Backup');
    });

    it(`create new wallet - skip security - appear in wallet`, () => {
        cy.visit('/');

        cy.window()
            .its('TrezorConnect')
            .should('exist')
            .then(TrezorConnect => {
                cy.stub(TrezorConnect, 'resetDevice', () => {
                    return new Promise(resolve => {
                        return resolve({ success: true });
                    });
                    // todo probably here we could call window.store.dispatch({ type: DEVICE.CHANGED })
                });

                cy.stub(TrezorConnect, 'getDeviceState', () => {
                    return new Promise(resolve => {
                        return resolve({
                            success: true,
                            payload: {
                                state:
                                    '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                            },
                        });
                    });
                });
            });

        cy.onboardingShouldLoad()
            .getTestElement('@onboarding/button-path-create')
            .click()
            // todo: add snapshots in distance future when everything is stable
            // .matchImageSnapshot()
            .get('html')
            .should('contain', 'New device')
            .getTestElement('@onboarding/button-new-path')
            .click()
            .get('html')
            .should('contain', 'Select your device')
            .getTestElement('@onboarding/option-model-t-path')
            .click()
            .get('html')
            .should('contain', 'Hologram check')
            .getTestElement('@onboarding/button-continue')
            .click()
            .getTestElement('@onboarding/pair-device-step')
            .connectDevice(
                {
                    path: DEVICE_PATH,
                    mode: 'initialize',
                    firmware: 'none',
                },
                {
                    firmware_present: false,
                    bootloader_mode: true,
                    initialized: false,
                },
            )
            .getTestElement('@onboarding/button-continue')
            .click()
            .get('html')
            .should('contain', 'Get the latest firmware')
            .changeDevice(
                DEVICE_PATH,
                {
                    mode: 'initialize',
                    firmware: 'valid',
                },
                {
                    firmware_present: true,
                    bootloader_mode: false,
                    initialized: false,
                },
            )
            .getTestElement('@onboarding/button-continue')
            .click()
            .get('html')
            .should('contain', 'Seed type')
            .getTestElement('@onboarding/button-standard-backup')
            .click()
            // it would be nice to dispatch change device as result of mocked TrezorConnect.resetDevice call
            // but I am not sure it is possible in Cypress.
            .changeDevice(
                DEVICE_PATH,
                { mode: 'normal' },
                { initialized: true, needs_backup: true },
            )
            .get('html')
            .should('contain', 'Take me to security')
            .getTestElement('button-exit-app')
            .click();
    });
});
