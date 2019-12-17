/* eslint-disable @typescript-eslint/camelcase */
import { TRANSPORT } from 'trezor-connect';

describe('Transport webusb/bridge', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.visit('').onboardingShouldLoad();

        cy.window().then(window => {
            cy.stub(window.TrezorConnect, 'disableWebUSB', () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        window.store.dispatch({
                            type: TRANSPORT.ERROR,
                            payload: {
                                error: 'failed to fetch',
                                bridge: {
                                    changelog: ['Fix Certificate issue on Windows'],
                                    directory: 'bridge/2.0.27/',
                                    packages: [
                                        {
                                            name: 'Linux 64-bit (deb)',
                                            platform: ['deb64'],
                                            preffered: true,
                                            signature: null,
                                            url: 'bridge/2.0.27/trezor-bridge_2.0.27_amd64.de',
                                        },
                                    ],
                                    version: [2, 0, 27],
                                },
                            },
                        });
                    }, 0);
                    return resolve({ success: true });
                });
            });
        });
    });

    it('user selects new device -> user selects model one -> in this case we know that he can not use webusb (unreadable device) so we disable webusb and offer bridge download', () => {
        cy.getTestElement('@onboarding/button-path-create')
            .click()
            .getTestElement('@onboarding/button-new-path')
            .click()
            .getTestElement('@onboarding/option-model-one-path')
            .click()
            .getTestElement('@onboarding/button-continue')
            .click()
            .getTestElement('@onboarding/bridge');
    });
});
