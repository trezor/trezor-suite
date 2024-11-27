/// <reference types="cypress" />

class Modal {
    close(): void {
        cy.getTestElement('@modal/close-button').click();
    }
}

export const onModal = new Modal();
