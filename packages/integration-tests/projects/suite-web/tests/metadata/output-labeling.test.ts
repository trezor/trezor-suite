// @stable

import { stubFetch, stubOpen } from '../../stubs/metadata';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    
    after(() => {
        cy.task('stopGoogle');
    });

    it(`
        Output labeling
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
            
            // todo: better waiting for discovery (mock it!)
            cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
            cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should('not.be.visible');

            cy.getTestElement('@metadata/outputLabel/33T7ExFCVnK2TiQhz73JiXiNLHFmo9JqN2/add-label-button').click({force: true});
            cy.passThroughInitMetadata();
            cy.getTestElement('@metadata/input').type('mnau cool label{enter}');

            // todo: 
            // cy.log('test that focusing one input blurs another already focused input');
            // cy.getTestElement('@metadata/outputLabel/33T7ExFCVnK2TiQhz73JiXiNLHFmo9JqN2').click();
            // cy.getTestElement('@metadata/edit-button').click();
            // cy.getTestElement('@metadata/outputLabel/bc1q7e6qu5smalrpgqrx9k2gnf0hgjyref5p36ru2m/add-label-button').click({force: true });
            // cy.getTestElement('@metadata/input').should('have.length', 1);
    });
});
