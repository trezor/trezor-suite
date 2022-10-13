/// <reference types="cypress" />

class SuiteGuide {
    openSidePanel() {
        cy.getTestElement('@guide/button-open', { timeout: 20000 }).should('be.visible').click();
        cy.getTestElement('@guide/panel').should('exist');
    }

    openFeedback() {
        cy.getTestElement('@guide/button-feedback').click();
    }

    openDesiredForm(formType: string) {
        cy.getTestElement(`@guide/feedback/${formType}`).click();
    }

    selectLocationInApp(desiredLocation: string) {
        cy.getTestElement('@guide/feedback/suggestion-dropdown').click();
        cy.getTestElement(
            `@guide/feedback/suggestion-dropdown/select/option/${desiredLocation.toLowerCase()}`,
        ).click();
    }

    fillInSuggestionForm(reportText: string) {
        cy.getTestElement('@guide/feedback/suggestion-form').type(reportText);
    }

    submitForm() {
        cy.getTestElement('@guide/feedback/submit-button').should('be.enabled').click();
    }

    sendBugreport({
        desiredLocation,
        reportText,
    }: {
        desiredLocation: string;
        reportText: string;
    }) {
        this.openDesiredForm('bug');
        this.selectLocationInApp(desiredLocation);
        this.fillInSuggestionForm(reportText);
        this.submitForm();
    }
}

export const onSuiteGuide = new SuiteGuide();
