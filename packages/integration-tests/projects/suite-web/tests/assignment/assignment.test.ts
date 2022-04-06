describe('Assignment test', () => {
    beforeEach(() => {
        // Configuration of env
        cy.viewport(1024, 768).resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
    });

    it('e2e test for assignment', () => {
        // This is the check for "https://suite.trezor.io/web/ )" which is generated on local host
        cy.url().should('include', 'localhost:8000');
        // Passing initial stages of Trezor Suite
        cy.passThroughInitialRun();

        /**
         * I am adding shoud for visibility check, as sometimes test or rather env started to be flaky.
         * Had various results with it but seems it helped.
         */
        cy.getTestElement('@suite/menu/settings').should('be.visible').click();
        cy.getTestElement('@settings/menu/device').click();

        /**
         * I have left wait here as test worked somewhat better with it although I dont fully understand why.
         * Without that wait I had troubles clicking setting icon. Maybe my mac is overall slow with it.
         */
        cy.wait(2000);
        cy.getTestElement('@settings/device/label-input')
            /**
             * Focus with type and invoke somehow work together. On my local run, when I used only invoke('val', '')
             * in theory it suppose to be enough, but wasn't. Once I added those other parts it was doing what it suppose to.
             * Havent figured out why standalone clear() nor type('{selectall}{backspace}') have not worked. I have noticed
             * my focuse was behind upper tab where Dashboeard, Device and other remains, but dont know what is behind it.
             */
            .focus()
            .type('{selectall}{backspace}', { force: true })
            .should('be.visible')
            .invoke('val', '') //this eventually worked, clear did not worked at all
            .type('Done!');
        /**
         * Somehow focus gets off without force:true and click wont work.
         * Same issue as upwards with focuse. Here force is enough to click.
         */
        cy.getTestElement('@settings/device/label-submit').click({ force: true });
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');
        cy.getTestElement('@suite/modal/confirm-action-on-device').should('not.exist');

        /**
         * This is not implemented. Setting phasphrase settings by my self always resulted in various weird behaviors
         * and test was very unstable. I tried it with  cy.task('setupEmu', { passphrase_protection: true }); And steps to click passphrase.
         * I believe there is some auto config somewhere but I was not able to find it.
         */
        // cy.getTestElement('@suite/menu/suite-index').click();
        // cy.get('Passphrase enabled');

        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('Done!');
    });
});
