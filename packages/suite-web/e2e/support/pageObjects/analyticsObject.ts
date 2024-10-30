/// <reference types="cypress" />

class AnalyticsPage {
    continue() {
        cy.getTestElement('@analytics/continue-button').click();
    }
}

export const onAnalyticsPage = new AnalyticsPage();
