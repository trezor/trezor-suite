// @group_device-management
// @retry=2

describe('Firmware', () => {
    beforeEach(() => {
        // use portrait mode monitor to prevent scrolling in settings
        cy.viewport(1440, 2560).resetDb();
    });

    it(`Firmware 2.5.2 outdated notification banner should open firmware update modal`, () => {
        cy.task('startEmu', { wipe: true, model: 'T2T1', version: '2.5.2' });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@notification/update-notification-banner').click();

        // initial screen
        cy.getTestElement('@firmware/install-button').click();

        // check seed screen
        cy.getTestElement('@modal/close-button').should('be.visible'); // modal is cancellable at this moment
        cy.getTestElement('@firmware-modal').matchImageSnapshot('check-seed');
        cy.getTestElement('@firmware/confirm-seed-checkbox').click();
        cy.getTestElement('@firmware/confirm-seed-button').click();

        // we can't really test anything from this point since this https://github.com/trezor/trezor-suite/pull/12472 was merged
        // in combination with not doing git lfs checkout in feature branches. Firmware will not be uploaded and an error is presented to user
        // but only in feature branches, develop or production branches should display correct behavior.

        // one point to get over this would be to stub correct (bigger) firmware binary response here, but I don't know how to stub fetch that
        // happens inside a nested iframe (connect-iframe).

        // cy.prefixedVisit('/', {
        //     onBeforeLoad: (win: Window) => {
        //         cy.stub(win, 'fetch').callsFake(
        //             (uri: string, options: Parameters<typeof fetch>[1]) => {
        //                 console.log('uri', uri);
        //                 if (uri.includes('static/connect/data/firmware/t2t1/')) {
        //                     return Promise.resolve(
        //                         new Response(new ArrayBuffer(0), { status: 200 }),
        //                     );
        //                 }

        //                 return fetch(uri, options);
        //             },
        //         );
        //     },
        // });

        // // reconnect in bootloader screen (disconnect)
        // cy.getTestElement('@firmware/disconnect-message', { timeout: 30000 });
        // cy.task('stopEmu');

        // // reconnect in bootloader screen (connect in bootloader)
        // cy.getTestElement('@firmware/connect-in-bootloader-message', { timeout: 20000 });
        // cy.log(
        //     'And this is the end my friends. Emulator does not support bootloader, so we can not proceed with actual fw install',
        // );
    });
});

export {};
