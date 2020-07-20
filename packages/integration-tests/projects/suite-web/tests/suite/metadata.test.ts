// @beta

describe('Metadata', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('??', () => {
        cy.prefixedVisit('/accounts', { onBeforeLoad: (win) => {
            // process of getting oauth token involves widow.open and waits for post message from it. Cypress can't touch other windows/tabs it so what we do here is that we replace implementation of window 
            // open to invoke only postMessage with data that satisfy application flow
            cy.stub(win, 'open', () => {
                win.postMessage('#access_token=chicken-cho-cha&token_type=bearer&state=foo-bar');
            })
            
            cy.stub(win, 'fetch', (uri, options) => {
                console.log(uri, options);

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
            })
        }});

        cy.task('startEmu');
        cy.passThroughInitialRun();

        cy.task('pressYes');
        

        cy.getTestElement('@modal/metadata-provider/google-button').click();
        cy.getTestElement('@modal/metadata-provider').should('not.exist');

        cy.getTestElement('@account-menu/btc/normal/0/label', { timeout: 30000 }).should('contain', 'label');
        cy.getTestElement('@account-menu/btc/normal/0/add-label-button').click();

    });
});
