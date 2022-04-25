// @group:suite
// @retry=2

describe('Stories of bug report forms', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { mnemonic: 'all all all all all all all all all all all all' });

        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /* Test case:
    1. Go to Bug section in Suite Guide
    2. Select Dashboard
    3. Write into feedback field
    4. Submit bug report (reporttext)
    */
    it(`Open Report form, fill bug report, submit report`, () => {
        //
        // Test preparation
        //
        const reporttext = 'Henlo this is testy test writing hangry test user report';

        //
        // Test execution
        //
        // goes to feedback
        cy.getTestElement('@guide/button-open', { timeout: 20000 }).click();
        cy.getTestElement('@guide/panel').should('exist');
        cy.getTestElement('@guide/button-feedback').click();
        cy.getTestElement('@guide/feedback/bug').click();

        // gets Dashboard input in dropdown
        cy.getTestElement('@guide/feedback/suggestion-dropdown').click();
        cy.getTestElement('@guide/feedback/suggestion-dropdown/select/option/dashboard').click();

        // writes into  field
        cy.getTestElement('@guide/feedback/suggestion-form').type(reporttext);

        // submits angry Franta User report
        cy.getTestElement('@guide/feedback/submit-button').click();

        //
        // Assert
        //
        cy.getTestElement('@guide/feedback/submit-button').should('not.exist');
    });
});
