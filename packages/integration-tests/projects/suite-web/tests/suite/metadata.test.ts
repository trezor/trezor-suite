// @stable

const stubFetch = (uri: string, options: Parameters<typeof fetch>[1]) => {
    console.log(uri, options);
    if (uri.includes('https://api.coingecko.com')) {
        return Promise.resolve(
            {
                status: 400,
                json: () => Promise.resolve({})
            })
    }
    if (uri.includes('https://www.googleapis.com/drive/v3/about')) {
        return Promise.resolve(
            {
                status: 200,
                json: () => Promise.resolve({
                    user: {
                        kind: "drive#user",
                        displayName: "Kryptonit",
                    }
                })
            })
    }

    // list request
    if (uri === 'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder') {
        return Promise.resolve({
            status: 200,
            json: () => Promise.resolve({
                "files": [
                    {
                        "kind": "drive#file",
                        "id": "13DH0FwzmGHmf2sWRBIvyJ9WJlkKTgL-KKamv-oqw6fvKqcQYGA",
                        "name": "f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt",
                        "mimeType": "text/plain"
                    },
            ]})
        })
    }

    // get request
    if (uri === 'https://www.googleapis.com/drive/v3/files/13DH0FwzmGHmf2sWRBIvyJ9WJlkKTgL-KKamv-oqw6fvKqcQYGA?alt=media') {
        return Promise.resolve({
            status: 200,
            text: () => Promise.resolve("fbace4e987076329426cc882058f8101dd99f1187cf075f9c76a4fedfa962fc5e34c55449fe4539d99dc31e83bff8084552416b43902500c9df9164ba84cf1845aaca0b7b70ec5a4ff90b83f6bb0d7e2ad0f215ec6aea65f5448534c17493d8ae150aa3e871e60b1978b68")
        })
    }
    // todo: return original fetch somehow, now it ends in endless loop if I return it here
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

    it(`
        In settings, there is enable metadata switch. On enable, it initiates metadata right away (if device already has state).
        On disable, it throws away all metadata related records from memory.
    `, () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.prefixedVisit('/accounts', { onBeforeLoad: (win: Window) => {
            cy.stub(win, 'open', stubOpen(win));
            cy.stub(win, 'fetch', stubFetch);
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
            cy.prefixedVisit('/accounts', { onBeforeLoad: (win) => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', (uri, options) => {
                    // upload request is mocked to respond with 200
                    if (uri.includes('https://www.googleapis.com/upload')) {
                        return Promise.resolve({
                            status: 200,
                        })
                    }
                    return stubFetch(uri, options)
    
                });
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

    it ('Token expires', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');

        cy.prefixedVisit('/settings', { onBeforeLoad: (win: Window) => {
            cy.stub(win, 'open', stubOpen(win));
            cy.stub(win, 'fetch', (uri, options) => {
                // upload request is mocked to respond with 401 which mimics response in case of expired token
                if (uri.includes('https://www.googleapis.com/upload')) {
                    return Promise.resolve({
                        status: 401,

                    })
                }
                return stubFetch(uri, options)

            });
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
});
