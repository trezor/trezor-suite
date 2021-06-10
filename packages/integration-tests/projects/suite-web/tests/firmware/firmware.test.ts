// @group:device-management
// @retry=2

describe('Firmware', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    ['1.9.4', '2.3.0'].forEach(fw => {
        it(`Firmware ${fw} outdated notification banner should open firmware update modal`, () => {
            cy.task('startEmu', { wipe: true, version: fw });
            cy.task('setupEmu');
            cy.task('startBridge');
            cy.prefixedVisit('/');
            cy.passThroughInitialRun();
            cy.matchImageSnapshot('outdated notification banner');
            cy.getTestElement('@notification/update-firmware/button').click();

            // // initial screen
            cy.getTestElement('@firmware/get-ready-button').click();

            // check seed screen
            cy.getTestElement('@modal/close-button').should('be.visible'); // modal is cancellable at this moment
            cy.wait(1000); // wait for animation to finish before taking a screenshot
            cy.getTestElement('@firmware').matchImageSnapshot('check-seed');
            cy.getTestElement('@firmware/confirm-seed-checkbox').click();
            cy.getTestElement('@firmware/confirm-seed-button').click();

            // reconnect in bootloader screen (disconnect)
            cy.getTestElement('@firmware/disconnect-message');
            cy.task('stopEmu');

            // reconnect in bootloader screen (connect in bootloader)
            cy.getTestElement('@firmware/connect-in-bootloader-message', { timeout: 20000 });
            cy.log(
                'And this is the end my friends. Emulator does not support bootloader, so we can not proceed with actual fw install',
            );
        });
    });

    ['1-master', '2-master'].forEach(fw => {
        it(`For latest firmware ${fw}, update button in device settings should display "Up to date" but still be clickable`, () => {
            cy.task('startEmu', { wipe: true, version: fw });
            cy.task('setupEmu');
            cy.task('startBridge');
            cy.prefixedVisit('/');
            cy.passThroughInitialRun();
            cy.getTestElement('@suite/menu/settings').click();
            cy.getTestElement('@suite/menu/settings-index').click();
            cy.getTestElement('@settings/menu/device').click();
            cy.getTestElement('@settings/device/update-button')
                .should('contain.text', 'Up to date')
                .click();
            cy.getTestElement('@modal/close-button').click();
        });
    });
});
