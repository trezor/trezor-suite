// @stable

import * as METADATA from '../../../../../suite/src/actions/suite/constants/metadataConstants';

const stubFetch = (uri: string, options: Parameters<typeof fetch>[1]) => {
    if (uri.includes('https://www.googleapis.com')) {
        return fetch(uri.replace('https://www.googleapis.com', 'http://localhost:30001'), options)
    }
    return fetch(uri, options);
}

// process of getting oauth token involves widow.open and waits for post message from it. Cypress can't touch other windows/tabs it so what we do here is that we replace implementation of window 
// open to invoke only postMessage with data that satisfy application flow
const stubOpen = (win: Window) => {
    // @ts-ignore
    return () => win.postMessage('#access_token=chicken-cho-cha&token_type=bearer&state=foo-bar');
}

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    after(() => {
        cy.task('stopGoogle');
    });

    it(`
        In settings, there is enable metadata switch. On enable, it initiates metadata right away (if device already has state).
        On disable, it throws away all metadata related records from memory.
    `, () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startGoogle');

        cy.prefixedVisit('/accounts', { onBeforeLoad: (win: Window) => {
            cy.stub(win, 'open', stubOpen(win));
            // cy.stub(win, 'fetch', stubFetch);
            cy.stub(win, 'fetch', stubFetch)
        }});

        cy.passThroughInitialRun();

        // todo: wait for discovery to finish and remove this
        cy.log('Wait for discovery to finish. There is "add label" button, but no actual metadata appeared')
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should('not.be.visible');
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');
        cy.getTestElement('@account-menu/btc/normal/0/add-label-button');


        cy.log('Go to settings and enable metadata');
        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });
        cy.task('pressYes');
        cy.getTestElement('@modal/metadata-provider/google-button').click();
        
        cy.log('Now metadata is enabled, go to accounts');
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'label');
        // todo: check all other label types

        cy.log("Now go back to settings, disable metadata and check that we don't see them in app");

        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');
        // todo: check all other label types
    });

    it(`
        Metadata is by default disabled, this means, that application does not try to generate master key and connect to cloud.
        - "add metadata" labels are still present and clicking on them enables metadata
        `, () => {
            // prepare test
            cy.task('startEmu', { wipe: true });
            cy.task('setupEmu');
            cy.task('startGoogle');

            cy.prefixedVisit('/accounts', { onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', stubFetch)

            }});
    
            cy.passThroughInitialRun();
    
            
            // todo: wait for discovery to finish and remove this
            cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
            cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should('not.be.visible');
    
            cy.log('Default label is "Bitcoin #1". Clicking on add label button triggers metadata flow');
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');
            cy.getTestElement('@account-menu/btc/normal/0/add-label-button').click();
            cy.task('pressYes');
            cy.getTestElement('@modal/metadata-provider/google-button').click();
            cy.getTestElement('@modal/metadata-provider').should('not.exist');

            cy.log("Before input becomes available to user, metadata is synced, so if there is already record for this account, it will be pre filled in the input");
            cy.getTestElement('@modal/add-metadata/input').should('have.value', 'label');
            cy.getTestElement('@modal/add-metadata/input').type('{backspace}{backspace}{backspace}{backspace}{backspace}My cool label for account');
            cy.getTestElement('@modal/add-metadata/submit-button').click();
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'My cool label for account');

    });

    it(`
        When passphrase is enabled, 
    `, () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: true });
        cy.task('startGoogle');

        cy.prefixedVisit('/settings', { onBeforeLoad: (win: Window) => {
            cy.stub(win, 'open', stubOpen(win));
            cy.stub(win, 'fetch', stubFetch);
        }});

        cy.passThroughInitialRun();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@passphrase/input').type('make metadata gr8 again');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.log('after initial passphrase input starts discovery which also triggers metadata init flow');
        cy.task('pressYes');
        cy.getTestElement('@modal/metadata-provider/google-button').click();

        cy.log('at this moment, metadata is connected and user returns back to passphrase validation');
        cy.getTestElement('@passphrase/input').type('make metadata gr8 again');
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();
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

            // cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');

    })
});
