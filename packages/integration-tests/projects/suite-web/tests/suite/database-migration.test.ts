// @group:migrations
// @retry=2

describe('Database migration', () => {
    beforeEach(() => {});

    Cypress.env('TEST_URLS').forEach((testUrl: string, index: number) => {
        const keepDB = index > 0;

        it(index === 0 ? `From ${testUrl}` : `To ${testUrl}`, () => {
            cy.viewport(1080, 1440);
            cy.task('startEmu', { wipe: true });
            cy.task('setupEmu');
            cy.task('startBridge');

            if (!keepDB) {
                cy.resetDb();
            }

            const { baseUrl } = Cypress.config();
            const assetPrefix = Cypress.env('ASSET_PREFIX');
            cy.visit(baseUrl + testUrl + assetPrefix);

            // This block will execute only when testing the first TEST_URL
            if (!keepDB) {
                cy.passThroughInitialRun();
                cy.discoveryShouldFinish();

                // todo:create data that are to be tested later in this block.

                // add some passphrase wallet
                // remember wallets
                // change settings (language, currency, theme)
                // backends, custom urls
                // nice to have: labeling
            }

            // KEEP_DB env is truthy.
            // This block will execute only in every other run expect for the first one
            // It means that migration took place and we should see the same data
            else {
                // asset data was loaded correctly from db
                cy.getTestElement('@dashboard/graph', { timeout: 30000 }).should('exist');
            }
        });
    });
});
