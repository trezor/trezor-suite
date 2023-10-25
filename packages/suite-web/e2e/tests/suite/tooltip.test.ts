// @group:suite
// @retry=2

describe('Test tooltip links', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: true });
        cy.task('startBridge');
        cy.task('applySettings', { passphrase_always_on_device: false });

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Learn button should open guide panel', () => {
        cy.getTestElement('@tooltip/passphrase-tooltip')
            .children()
            .children()
            .trigger('mouseenter');
        cy.getTestElement('@tooltip/guideAnchor').click();
        cy.getTestElement('@guide/panel').should('exist');
    });
});

export {};

describe('Test tooltip conditional rendering', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { mnemonic: 'all all all all all all all all all all all all' });
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    it('Tooltip conditional rendering', () => {
        // Tooltip should not render if device is connected
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0/toggle-remember-switch').click({
            force: true,
        });
        cy.getTestElement('@switch-device/add-hidden-wallet-button')
            .trigger('mouseenter')
            .getTestElement('@tooltip')
            .should('not.exist');

        // Tooltip should render if device is disconnected
        cy.task('stopEmu');
        cy.task('stopBridge');
        cy.getTestElement('@deviceStatus-disconnected', { timeout: 20000 })
            .getTestElement('@switch-device/add-hidden-wallet-button')
            .trigger('mouseenter', {
                force: true,
            })
            .getTestElement('@tooltip')
            .should('exist');
    });
});

export {};
