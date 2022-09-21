/// <reference types="cypress" />

class TopBar {
    openAccounts() {
        cy.getTestElement('@suite/menu/wallet-index', { timeout: 30000 })
            .should('be.visible')
            .click();
        cy.getTestElement('@account-menu/search-input', { timeout: 15000 }).should('be.visible');
    }

    openSettings() {
        cy.getTestElement('@suite/menu/settings', { timeout: 30000 }).should('be.visible').click();
        cy.getTestElement('@settings/menu/general').should('be.visible');
    }
}

export const onTopBar = new TopBar();
