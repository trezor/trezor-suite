// @group_migrations
// @retry=2

// TODO: currently runs only on these. When there are some releases done via github, refactor this to run this from release "release - 1" branch to "release" branch
const from = 'release/22.5/web';
const to = 'develop/web';

describe('Database migration', () => {
    /**
     * Test case:
     * 1. in in the older version of the app navigate to settings/device and verify settings state
     * 2. navigate to the wallet overview and add the hidden QA wallet
     * 3. navigate to Accounts, click on the first btc account and verify tx
     * 4. remember the wallet
     * 5. navigate to the newer version of the app
     * 6. navigate to the wallet overview and verify that the remembered wallet is still present
     * 7. navigate to Accounts, click on the first btc account and verify that txs are still present
     * and the same as in the old app
     * 8. click on the Receive btn and verify that the address displays normally
     * 9. click on the Send btn and verify that the form is not broken
     * 10. verify that a dark theme is still applied
     */
    it(`Db migration between: ${from} => ${to}`, () => {
        //
        // Test data preparation
        //
        const testData = {
            accPhrase: 'doggo je dobros',
            btcAddress: 'bc1qkmdl2z9u503r6r5s6kyrczje60e2ye7ne7q53e',
        };
        // this test can be run only in sldev so we ignore baseUrl env variable
        const baseUrl = 'https://dev.suite.sldev.cz/suite-web';
        const workaroundBtcAddressInputSelector = 'outputs.0.address';
        cy.viewport(1440, 2560);
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            passphrase_protection: true,
        });
        cy.task('startBridge');
        cy.resetDb();

        //
        // Test execution
        //

        // FROM

        cy.visit(`${baseUrl}/${from}`);
        // naming of data-tests has been changed in current version so we need to use the old ones
        cy.get('[data-test="@onboarding/continue-button"]', { timeout: 40000 })
            .click()
            .get('[data-test="@onboarding/exit-app-button"]')
            .click()
            .get('[data-test="@suite/loading"]')
            .should('not.exist');
        cy.get('[data-test="@passphrase-type/standard"]').click();
        cy.get('[data-test="@wallet/discovery-progress-bar"]', { timeout: 45_000 });
        cy.get('[data-test="@wallet/discovery-progress-bar"]', { timeout: 45_000 }).should(
            'not.exist',
        );

        // change settings
        cy.get('[data-test="@suite/menu/settings"]').click();
        cy.get('[data-test="@theme/color-scheme-select/input"]').click();
        cy.get('[data-test="@theme/color-scheme-select/option/dark"]').click();
        cy.get('[data-test="@theme/color-scheme-select/input"]').should('contain', 'Dark');

        // remembering the wallet
        cy.get('[data-test="@menu/switch-device"]').click();
        cy.get('[data-test="@modal"]').should('be.visible');
        cy.get('[data-test="@switch-device/add-hidden-wallet-button"]').click();
        cy.get('[data-test="@passphrase/input"]').should('be.visible').type(testData.accPhrase);
        cy.get('[data-test="@passphrase/hidden/submit-button"]').click();
        cy.wait(500);
        cy.task('pressYes');
        cy.task('pressYes');
        cy.get('[data-test="@discovery/loader"]').should('be.visible');
        cy.get('[data-test="@discovery/loader"]').should('not.exist');
        cy.get('[data-test="@wallet/discovery-progress-bar"]', { timeout: 45_000 });
        cy.get('[data-test="@wallet/discovery-progress-bar"]', { timeout: 45_000 }).should(
            'not.exist',
        );

        // TODO: After Suite Empower is released this line needs to be changed
        //       to something like: `cy.getTestElement('@account-menu/btc/normal/0').click();`
        //       The test currently still works with tagged release version that has old selectors
        //       from before the redesign.
        //
        cy.get('[data-test="@suite/menu/wallet-index').click();

        // in the Send form, fill in a btc address
        cy.get('[data-test="@wallet/menu/wallet-send"]').click();
        cy.get('[data-test="outputs[0].address"]').should('be.visible').type(testData.btcAddress);
        cy.wait(500); // wait has to be for a state save to happen
        cy.get('[data-test="@wallet/menu/close-button"]').last().click();

        // check and store address of first btc tx
        cy.get('[data-test^="@metadata/outputLabel"] > span').should('be.visible');
        cy.get('[data-test^="@metadata/outputLabel"] > span')
            .first()
            .invoke('text')
            .as('firstTxLabel');
        // remember the wallet
        cy.get('[data-test="@menu/switch-device"]').click();
        cy.contains('[data-test^="@switch-device/wallet-on-index"]', 'Hidden wallet #1')
            .find('[data-test*="toggle-remember-switch"]')
            .click()
            .find('input')
            .should('be.checked');
        cy.task('stopEmu');
        cy.get('@firstTxLabel').then(label => {
            cy.log(`hue hue tx label: ${label}`);
        });

        // TO:
        cy.visit(`${baseUrl}/${to}`);
        cy.getTestElement('@dashboard/graph', { timeout: 40000 }).should('be.visible');
        cy.getTestElement('@account-menu/btc/normal/0').click();
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@deviceStatus-disconnected');
        cy.contains('[data-testid^="@switch-device/wallet-on-index"]', 'Passphrase wallet #1')
            .find('input')
            .should('be.checked');

        cy.getTestElement('@switch-device/cancel-button').click();

        cy.get('[data-testid^="@metadata/outputLabel"]').first().should('be.visible');

        // TODO: cypress alias is empty for unknown reason, refactor this test to playwright
        // check the first tx and verify it against the stored one
        // cy.get('[data-testid^="@metadata/outputLabel"]')
        //     .first()
        //     .invoke('text')
        //     .then(readFirstTx => {
        //         cy.get('@firstTxLabel').then(savedLabel => {
        //             expect(readFirstTx).to.be.eq(savedLabel);
        //         });
        //     });

        // go to receive tab, trigger show address to make sure passphrase is properly cached
        // -> no passphrase prompt should be displayed
        cy.getTestElement('@wallet/menu/wallet-receive').click();
        cy.getTestElement('@wallet/receive/reveal-address-button').click();

        // device not connected warning modal
        cy.getTestElement('@modal');
        cy.getTestElement('@modal/close-button').click().should('not.exist');

        cy.task('startEmu');
        cy.getTestElement('@deviceStatus-connected').should('be.visible');
        cy.getTestElement('@account-subpage/back').last().click();

        // checking the Send form
        cy.getTestElement('@wallet/menu/wallet-send').click();
        // TODO: remove this workaround after the "old" version also uses the new data-testid attribute
        cy.getTestElement(workaroundBtcAddressInputSelector)
            .should('be.visible')
            .invoke('attr', 'value')
            .should('eq', testData.btcAddress);
        cy.getTestElement('@account-subpage/back').last().click();

        cy.get('body').should('have.css', 'background-color', 'rgb(23, 23, 23)');
    });
});

export {};
