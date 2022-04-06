describe('Assignment test', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
    });

    it('e2e test for assignment', () => {
        cy.url().should('include', 'localhost:8000');
        cy.passThroughInitialRun();

        cy.getTestElement('@suite/menu/settings').should('be.visible').click();
        cy.getTestElement('@settings/menu/device').click();

        // cy.pause();
        cy.wait(2000);
        cy.getTestElement('@settings/device/label-input')
            .focus()
            .type('{selectall}{backspace}',{ force: true } )
            .should('be.visible')
            .invoke('val', '') //this eventually worked, clear did not worked at all
            .type('Done!');
            //somehow focus gets off without force:true and click wont work.
        cy.getTestElement('@settings/device/label-submit').click({ force: true });
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');
        cy.getTestElement('@suite/modal/confirm-action-on-device').should('not.exist');

// This is not implemented. Setting phasphrase setting by my self always resulted in various weird behaviors and test was very unstable
        // cy.getTestElement('@suite/menu/suite-index').click();
        // cy.get('Passphrase enabled');

        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('Done!');
    });
});
