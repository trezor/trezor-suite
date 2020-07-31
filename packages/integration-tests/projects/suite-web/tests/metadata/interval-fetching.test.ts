// @stable

import * as METADATA from '../../../../../suite/src/actions/suite/constants/metadataConstants';
import { stubFetch, stubOpen } from '../../stubs/metadata';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    after(() => {
        cy.task('stopGoogle');
    });

    it(`
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
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({ force: true });
            
            cy.task('pressYes');
            cy.getTestElement('@modal/metadata-provider/google-button').click();
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'label');
    
    
            cy.log('Go to settings and lets see what happens if user wipes his data from google drive interface (out of suite)');            
            cy.getTestElement('@suite/menu/settings-index').click();
            cy.getTestElement('@settings/metadata/disconnect-provider-button');
            cy.log('Next command simulates that user wiped his google drive');
            cy.task('setupGoogle', { prop: 'files', value: []});
            cy.tick(METADATA.FETCH_INTERVAL);
            cy.getTestElement('@settings/metadata/connect-provider-button');

            cy.getTestElement('@suite/menu/wallet-index').click();
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');
    })
});
