/// <reference types="cypress" />

class SettingsDevicePage {
    openCreateMultiShareBackup(): void {
        cy.getTestElement('@settings/device/create-multi-share-backup-button')
            .should('be.visible')
            .click();
        cy.getTestElement('@multi-share-backup/1st-info/submit-button').should('be.visible');
    }

    togglePinSwitch(): void {
        cy.getTestElement('@settings/device/pin-switch').should('be.visible').wait(500).click();
    }
}

export const onSettingsDevicePage = new SettingsDevicePage();
