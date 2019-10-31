/* eslint-disable @typescript-eslint/camelcase */
const FIRST_DEVICE_PATH = '1';
const SECOND_DEVICE_PATH = '2';

describe('Stories of device connecting', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.visit('/');
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

    describe('1+ device is already connected -> user connects another one -> selects it ', () => {
        beforeEach(() => {
            cy.getTestElement('button-use-wallet').click();
            cy.get('html').should('contain', 'Connect Trezor to continue');
            cy.connectDevice({ path: FIRST_DEVICE_PATH }, { device_id: FIRST_DEVICE_PATH });
            cy.walletShouldLoad();
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
                .getTestElement('@wallet/layout');
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

    describe('No device connected yet -> user connects a new one', () => {
        beforeEach(() => {
            cy.getTestElement('button-use-wallet').click();
            cy.get('html').should('contain', 'Connect Trezor to continue');
        });

        it(`bootloader mode -> show info about bootloader, no wallet`, () => {
            cy.connectBootloaderDevice(SECOND_DEVICE_PATH).getTestElement('bootloader-message');
        });

        it(`undreadable device -> show info about unreadable`, () => {
            cy.connectDevice({ path: SECOND_DEVICE_PATH, type: 'unreadable' }).getTestElement(
                'unreadable-device-message',
            );
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
            ).getTestElement('@wallet/layout');
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
            cy.getTestElement('firmware-static-page');
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
            cy.getTestElement('seedles-message');
        });
    });
});
