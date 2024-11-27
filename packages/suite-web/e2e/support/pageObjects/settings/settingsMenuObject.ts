/// <reference types="cypress" />

class SettingsMenu {
    openDeviceSettings(): void {
        cy.getTestElement('@settings/menu/device').click();
    }

    openWalletSettings(): void {
        cy.getTestElement('@settings/menu/wallet').click();
    }
}

export const onSettingsMenu = new SettingsMenu();
