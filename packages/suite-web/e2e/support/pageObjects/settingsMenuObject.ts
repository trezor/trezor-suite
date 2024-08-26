/// <reference types="cypress" />

class SettingsMenu {
    openDeviceSettings(): void {
        cy.getTestElement('@settings/menu/device').should('be.visible').click();
    }

    openWalletSettings(): void {
        cy.getTestElement('@settings/menu/wallet').should('be.visible').click();
    }
}

export const onSettingsMenu = new SettingsMenu();
