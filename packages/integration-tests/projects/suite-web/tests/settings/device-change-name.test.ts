// @group:settings
// @retry=2

describe('Device settings', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();


        // go to settings of the device
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@suite/menu/settings-device').click();

    });


    it('Change Device name', { scrollBehavior: 'center' }, () => {

        cy.getTestElement('@settings/device/label-submit').should('be.disabled');
        cy.getTestElement('@settings/device/label-input')
            .should('have.value', 'My Trevor')
            .clear()
            .type('My Tenzor');

        cy.getTestElement('@settings/device/label-submit').click();
        cy.getConfirmActionOnDeviceModal();

        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        // cy.get('span').contains('Settings changed successfully');
        cy.getTestElement('@settings/device/label-input').should('have.value', 'My Tenzor');
        cy.getTestElement('@settings/device/label-submit').should('be.disabled');

        // Device name changed successfully

    });

    it('Change Device name - no symbols', { scrollBehavior: 'center' }, () => {

        cy.getTestElement('@settings/device/label-submit').should('be.disabled');
        cy.getTestElement('@settings/device/label-input')
            .should('have.value', 'My Trevor')
            .clear();

        cy.getTestElement('@settings/device/label-input').should('have.value', '');
        cy.getTestElement('@settings/device/label-submit').should('be.disabled');

        // Device name not changed

    });

    it('Change Device symbols - limit', { scrollBehavior: 'center' }, () => {

        cy.getTestElement('@settings/device/label-submit').should('be.disabled');
        cy.getTestElement('@settings/device/label-input')
            .should('have.value', 'My Trevor')
            .clear()
            .type('12345678901234567');

        cy.getTestElement('@settings/device/label-input').should('have.value', '12345678901234567');
        cy.getTestElement('@settings/device/label-submit').should('be.disabled');

        // Device name not changed

    });
});