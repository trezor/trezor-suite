// @stable

import { stubFetch, stubOpen } from '../../stubs/metadata';

// we don't do that
describe.skip('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    after(() => {
        cy.task('stopGoogle');
    });

    it(`
        It is possible to work with metadata without sync with persistent storage
        - click add metadata
        - click "continue without saving"
        - metadata is saved locally and survives reload if devices is set to "remember"
    `, () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startGoogle');

        cy.prefixedVisit('/accounts', { onBeforeLoad: (win) => {
            cy.stub(win, 'open', stubOpen(win));
            cy.stub(win, 'fetch', stubFetch);
        }});

        cy.passThroughInitialRun();

        cy.log('Remember device');

        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should('not.be.visible');

        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');
        cy.getTestElement('@account-menu/btc/normal/0/add-label-button').click();
        cy.task('pressYes');
        cy.getTestElement('@modal/metadata-provider/cancel-button').click();
        cy.getTestElement('@modal/add-metadata/input').type('{backspace}{backspace}{backspace}{backspace}{backspace}My cool label for account');
        cy.getTestElement('@modal/add-metadata/submit-button').click();
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'My cool label for account');
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-instance/toggle-remember-switch').click({ force: true });
        cy.getTestElement('@switch-device/wallet-instance').click();
        cy.prefixedVisit('/accounts', { onBeforeLoad: (win) => {
            cy.stub(win, 'fetch', stubFetch);
        }});

        cy.log('No "enable labeling" call, no sync cloud provider appears. All is loaded from storage');
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'My cool label for account');
    })

});
