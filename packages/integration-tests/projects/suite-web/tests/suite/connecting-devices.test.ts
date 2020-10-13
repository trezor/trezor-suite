/* eslint-disable @typescript-eslint/camelcase */

// @group:suite
// @retry=2

const FIRST_DEVICE_PATH = '1';
const SECOND_DEVICE_PATH = '2';

// trying skipped test
describe('Stories of device connecting', () => {
    before(() => {
        cy.task('stopEmu');
    });
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        // some route that will not trigger discovery, it does not matter in this test
        cy.prefixedVisit('/settings');
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

        it.skip(`bootloader mode -> show info about bootloader, no wallet`, () => {
            cy.connectBootloaderDevice(SECOND_DEVICE_PATH);
            cy.getTestElement('@device-invalid-mode/bootloader').matchImageSnapshot('bootloader');
        });

        it(`unreadable device -> show info about unreadable`, () => {
            cy.connectDevice({ path: SECOND_DEVICE_PATH, type: 'unreadable' });
            cy.getTestElement('@device-invalid-mode/unreadable').matchImageSnapshot('unreadable');
        });

        it(`device without seed -> offer onboarding, no wallet`, () => {
            cy.connectDevice({
                path: SECOND_DEVICE_PATH,
                mode: 'initialize',
            }).onboardingShouldLoad();
        });

        it(`outdated firmware -> load normally`, () => {
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
            ).getTestElement('@settings/index');
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
            cy.getTestElement('@device-invalid-mode/seedless').matchImageSnapshot('seedless');
        });
    });

    // todo: still some troubles here
    describe.skip('1+ device is already connected -> user connects another one -> selects it ', () => {
        beforeEach(() => {
            cy.getTestElement('@modal/connect-device');
            cy.connectDevice({ path: FIRST_DEVICE_PATH }, { device_id: FIRST_DEVICE_PATH });
        });

        it(`bootloader mode -> show info about bootloader, offer firmware update or switch device`, () => {
            cy.connectBootloaderDevice(SECOND_DEVICE_PATH);
            cy.toggleDeviceMenu();
            cy.getTestElement(`@switch-device/${SECOND_DEVICE_PATH}/solve-issue-button`).click();
            cy.getTestElement('@device-invalid-mode/bootloader');
        });

        it(`undreadable device -> show info about undreadable device, offer switch device`, () => {
            cy.connectDevice({ path: SECOND_DEVICE_PATH, type: 'unreadable' });
            cy.toggleDeviceMenu();
            cy.getTestElement(`@switch-device/${SECOND_DEVICE_PATH}/solve-issue-button`).click();
            cy.getTestElement('@device-invalid-mode/unreadable');
        });

        it(`device without seed -> show info about uninitialized device, offer onboarding or switch device`, () => {
            cy.connectDevice({ path: SECOND_DEVICE_PATH, mode: 'initialize' });
            cy.toggleDeviceMenu();
            cy.getTestElement(`@switch-device/${SECOND_DEVICE_PATH}/solve-issue-button`).click();
            cy.getTestElement('@device-invalid-mode/initialize');
        });

        it(`outdated firmware -> load normally`, () => {
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
            cy.toggleDeviceMenu();
            cy.getTestElement(`@switch-device/${SECOND_DEVICE_PATH}/solve-issue-button`).should(
                'not.exist',
            );
        });

        it(`required firmware -> show info, offer go to firmware or switch device`, () => {
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
            cy.toggleDeviceMenu();
            cy.getTestElement(`@switch-device/${SECOND_DEVICE_PATH}/solve-issue-button`).click();
            cy.getTestElement('@device-invalid-mode/update-required');
        });

        it(`seedless device -> show info about seedless, offer switch device`, () => {
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
            cy.toggleDeviceMenu();
            cy.getTestElement(`@switch-device/${SECOND_DEVICE_PATH}/solve-issue-button`).click();
            cy.getTestElement('@device-invalid-mode/seedless');
        });
    });
});
