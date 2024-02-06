// @group:suite
// @retry=2

import { onSuiteGuide } from '../../support/pageObjects/suiteGuideObject';

describe('Stories of bug report forms', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { mnemonic: 'all all all all all all all all all all all all' });

        cy.task('startBridge');
        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /**
     * Test case:
     * 1. Go to Bug section in Suite Guide
     * 2. Select Dashboard
     * 3. Write into feedback field
     * 4. Submit bug report (reporttext)
     */
    it(`Send a bug report`, () => {
        //
        // Test preparation
        //
        const testData = {
            desiredLocation: 'Account',
            reportText: 'Henlo this is testy test writing hangry test user report',
        };

        //
        // Test execution
        //

        onSuiteGuide.openSidePanel();
        onSuiteGuide.openFeedback();
        onSuiteGuide.sendBugreport(testData);

        //
        // Assert
        //
        cy.getTestElement('@toast/user-feedback-send-success').should('be.visible');
    });
});

export {};
