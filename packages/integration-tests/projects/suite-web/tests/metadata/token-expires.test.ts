// @stable

import { stubFetch, stubOpen } from '../../stubs/metadata';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    after(() => {
        cy.task('stopGoogle');
    });

    it('Token expires', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startGoogle');

        cy.prefixedVisit('/settings', { onBeforeLoad: (win: Window) => {
            cy.stub(win, 'open', stubOpen(win));
            cy.stub(win, 'fetch', stubFetch);

        }});

        cy.passThroughInitialRun();

        cy.getTestElement('@settings/metadata-switch').click({ force: true });
        cy.log('interesting is that init metadata flow does not start, it is because device is not authorized')

        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.task('pressYes');
        cy.getTestElement('@modal/metadata-provider/google-button').click();
        cy.getTestElement('@modal/metadata-provider').should('not.exist');

        // todo: wait for discovery to finish and remove this
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should('not.be.visible');
            
        cy.log('at this moment, oauth token expires');
        cy.getTestElement('@account-menu/btc/normal/0/add-label-button').click();
        cy.getTestElement('@modal/add-metadata/input').type('Kvooo');
        cy.task('setupGoogle', { prop: 'user', value: null });

        cy.getTestElement('@modal/add-metadata/submit-button').click();
        cy.get('body').should('contain.text', 'Failed to sync data with cloud provider');

    })

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
        // cy.reload();
        cy.prefixedVisit('/accounts', { onBeforeLoad: (win) => {
            cy.stub(win, 'fetch', stubFetch);
        }});

        cy.log('No "enable labeling" call, no sync cloud provider appears. All is loaded from storage');
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'My cool label for account');
    })

    it.only(`
        suite is watching cloud provider and syncs periodically
    `, () => {
           // prepare test

            cy.task('startEmu', { wipe: true });
            cy.task('setupEmu');
            cy.task('startGoogle');
            cy.clock();
    
            cy.prefixedVisit('/accounts', { onBeforeLoad: (win) => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', stubFetch);
            }});
            cy.tick(1000);
    
            cy.passThroughInitialRun();
            cy.log('Wait for discovery to finish. There is "add label" button, but no actual metadata appeared')
            cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
            cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should('not.be.visible');
            cy.getTestElement('@account-menu/btc/normal/0/add-label-button').click();
            cy.task('pressYes');
            cy.getTestElement('@modal/metadata-provider/google-button').click();
            cy.getTestElement('@modal/add-metadata/submit-button').click();
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'label');
    
    
            cy.log('Go to settings and lets see what happens if user wipes his data from google drive interface (out of suite)');            
            cy.getTestElement('@suite/menu/settings-index').click();
            cy.getTestElement('@settings/metadata/disconnect-provider-button');
            cy.log('Next command simulates that user wiped his google drive');
            cy.task('setupGoogle', { prop: 'files', value: []});
            cy.tick(METADATA.FETCH_INTERVAL);
            cy.getTestElement('@settings/metadata/connect-provider-button');

            cy.log('In accounts, see that although provider is disconnected now, previously set label remains there (saved locally)');
            cy.getTestElement('@suite/menu/wallet-index').click();
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'label');
            // todo: ?? shall it erase local labels?
    })
});
