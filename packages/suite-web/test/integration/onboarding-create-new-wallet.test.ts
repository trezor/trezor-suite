/* eslint-disable @typescript-eslint/camelcase */
import { DEVICE } from 'trezor-connect';

// todo: importing like this works now.
// import * as connectActions from '@onboarding-actions/connectActions';

// declaration for support files is not present in babel.config (and probably shouldnt be)
import { getConnectDevice, getDeviceFeatures } from '../../../suite/src/support/tests/setupJest';

describe('Onboarding', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    // todo: not finished yet, now I can control everything that happens in the app
    // through dispatching mocked actions, but I want to interact as close
    // to UI as possible, so I will need to mock trezor-connect that
    // is invoked on user clicks
    it(`create new wallet happy path`, () => {
        cy.visit('/')
            .get('html')
            .should('contain', 'Welcome to Trezor')
            .getTestElement('button-path-create')
            .click()
            // todo: add snapshots in distance future when everything is stable
            // .matchImageSnapshot()
            .get('html')
            .should('contain', 'New device')
            .getTestElement('button-new-path')
            .click()
            .get('html')
            .should('contain', 'Select your device')
            .getTestElement('option-model-t-path')
            .click()
            .get('html')
            .should('contain', 'Hologram check')
            .getTestElement('button-continue')
            .click()
            .get('html')
            .should('contain', 'Pair device')
            .window()
            .its('store')
            .invoke('dispatch', {
                type: DEVICE.CONNECT,
                payload: getConnectDevice({
                    mode: 'initialize',
                    firmware: 'none',
                    features: getDeviceFeatures({
                        firmware_present: false,
                        bootloader_mode: true,
                        initialized: false,
                    }),
                }),
            })
            .getTestElement('button-continue')
            .click()
            .get('html')
            .should('contain', 'Pair device')
            .window()
            .its('store')
            .invoke('dispatch', {
                type: DEVICE.CHANGED,
                payload: getConnectDevice({
                    mode: 'initialize',
                    firmware: 'valid',
                    features: getDeviceFeatures({
                        firmware_present: true,
                        bootloader_mode: false,
                        initialized: false,
                    }),
                }),
            })
            .getTestElement('button-continue')
            .click()
            .get('html')
            .should('contain', 'Seed type')
            // todo: here it would be nice to click. but to be able to do that, I would need to have
            // mocked trezor-connect or @onboarding-actions/connectActions module. To be able to mock
            // such module, I need to setup entire typescript to understand our custom import paths.
            // currently, we have paths specified in babel config, typescript has different syntax
            // IT WOULD BE BEST to figure out, how to make next-config work with cypress tests
            // .getTestElement('button-standard-backup')
            // .click();

            // todo: so heree I just simulate button click by dispatching actions it would trigger in the end.
            // this is not the way I would like to go.
            .window()
            .its('store')
            .invoke('dispatch', {
                type: DEVICE.CHANGED,
                payload: getConnectDevice({
                    mode: 'normal',
                    firmware: 'valid',
                    features: getDeviceFeatures({
                        initialized: true,
                        needs_backup: true,
                    }),
                }),
            })
            .window()
            .its('store')
            .invoke('dispatch', {
                type: '@onboarding/set-step-active',
                stepId: 'security',
            })
            .get('html')
            .should('contain', 'Take me to security')
            .getTestElement('button-exit-app')
            .click();
    });
});
