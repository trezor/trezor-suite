/* eslint-disable @typescript-eslint/camelcase */
const FIRST_DEVICE_PATH = '1';
const SECOND_DEVICE_PATH = '2';

// todo: appears to be flaky, will debug asap
describe.skip('Stories of device connecting', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.visit('/');
        cy.passThroughInitialRun();
        cy.window()
            .its('TrezorConnect')
            .should('exist')
            .then(TrezorConnect => {
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
                cy.stub(TrezorConnect, 'getAccountInfo', () => {
                    return new Promise(resolve => {
                        return resolve({
                            success: false,
                            payload: {},
                        });
                    });
                });
            });
    });

    describe('No device connected yet -> user connects a new one', () => {
        beforeEach(() => {
            cy.getTestElement('@modal/connect-device');
        });

        it(`bootloader mode -> show info about bootloader, no wallet`, () => {
            cy.connectBootloaderDevice(SECOND_DEVICE_PATH).getTestElement('@device-invalid-mode/bootloader');
        });

        it(`undreadable device -> show info about unreadable`, () => {
            cy.connectDevice({ path: SECOND_DEVICE_PATH, type: 'unreadable' }).getTestElement('@device-invalid-mode/unreadable')
        });

        it(`device without seed -> offer onboarding, no wallet`, () => {
            cy.connectDevice({
                path: SECOND_DEVICE_PATH,
                mode: 'initialize',
            }).onboardingShouldLoad();
        });

        it(`outdated firmware -> load wallet`, () => {
            cy.connectDevice(
                {
                    path: SECOND_DEVICE_PATH,
                    mode: 'normal',
                    firmware: 'outdated',
                },
                {
                    device_id: SECOND_DEVICE_PATH,
                    initialized: true,
                },
            ).getTestElement('@dashboard/index');
        });

        it(`required firmware -> firmware static page`, () => {
            cy.connectDevice(
                {
                    path: SECOND_DEVICE_PATH,
                    mode: 'normal',
                    firmware: 'required',
                },
                {
                    device_id: SECOND_DEVICE_PATH,
                    initialized: true,
                },
            );
            cy.getTestElement('@firmware/index');
        });

        it(`seedless device -> show info about seedless`, () => {
            cy.connectDevice(
                {
                    path: SECOND_DEVICE_PATH,
                    mode: 'seedless',
                },
                {
                    device_id: SECOND_DEVICE_PATH,
                    no_backup: true,
                },
            );
            cy.getTestElement('@device-invalid-mode/seedless')
        });
    });
    
    // todo: a little later, I need to touch switch-device modal and menu and it would cause conflicts at the moment
    describe.skip('1+ device is already connected -> user connects another one -> selects it ', () => {
        beforeEach(() => {
            cy.getTestElement('@modal/connect-device');
            cy.connectDevice({ path: FIRST_DEVICE_PATH }, { device_id: FIRST_DEVICE_PATH });
            cy.dashboardShouldLoad();
        });

        it(`bootloader mode -> show info about bootloader`, () => {
            cy.connectBootloaderDevice(SECOND_DEVICE_PATH);
            cy.toggleDeviceMenu()
                .getTestElement('@suite/device-item-0')
                .click()
                .getTestElement('bootloader-message');
        });

        it(`undreadable device -> show info about undreadable`, () => {
            cy.connectDevice({ path: SECOND_DEVICE_PATH, type: 'unreadable' });
            cy.toggleDeviceMenu()
                .getTestElement('@suite/device-item-0')
                .click()
                .getTestElement('unreadable-device-message');
        });

        it(`device without seed -> show info about uninitialize, offer onboarding`, () => {
            cy.connectDevice({ path: SECOND_DEVICE_PATH, mode: 'initialize' });
            cy.toggleDeviceMenu()
                .getTestElement('@suite/device-item-0')
                .click()
                .getTestElement('initialize-message');
        });

        it(`outdated firmware -> load wallet normally`, () => {
            cy.connectDevice(
                {
                    path: SECOND_DEVICE_PATH,
                    mode: 'normal',
                    firmware: 'outdated',
                },
                {
                    device_id: SECOND_DEVICE_PATH,
                    initialized: true,
                },
            );
            cy.toggleDeviceMenu()
                .getTestElement('@suite/device-item-0')
                .click()
                .getTestElement('@dashboard/index');
        });

        it(`required firmware -> show info, offer go to firmware`, () => {
            cy.connectDevice(
                {
                    path: SECOND_DEVICE_PATH,
                    mode: 'normal',
                    firmware: 'required',
                },
                {
                    device_id: SECOND_DEVICE_PATH,
                    initialized: true,
                },
            );
            cy.toggleDeviceMenu()
                .getTestElement('@suite/device-item-0')
                .click()
                .getTestElement('firmware-required-message')
                .getTestElement('@wallet/layout')
                .should('not.exist');
        });

        it(`seedless device -> show info about seedles`, () => {
            cy.connectDevice(
                {
                    path: SECOND_DEVICE_PATH,
                    mode: 'seedless',
                },
                {
                    device_id: SECOND_DEVICE_PATH,
                    no_backup: true,
                },
            );
            cy.toggleDeviceMenu()
                .getTestElement('@suite/device-item-0')
                .click()
                .getTestElement('seedles-message');
        });
    });
});
