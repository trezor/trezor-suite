/// <reference types="cypress" />

class Modal {
    close(): void {
        cy.getTestElement('@modal/close-button').should('be.visible').click();
    }
}

export const onModal = new Modal();
