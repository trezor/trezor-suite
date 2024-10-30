/// <reference types="cypress" />

class RecoverPage {
    selectWordCount(number: number) {
        cy.getTestElement(`@recover/select-count/${number}`).click();
    }

    selectBasicRecovery() {
        cy.getTestElement('@recover/select-type/basic').click();
    }
}

export const onRecoverPage = new RecoverPage();
