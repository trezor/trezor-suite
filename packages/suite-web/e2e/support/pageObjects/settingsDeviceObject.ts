/// <reference types="cypress" />

class SettingsDevicePage {
    openCreateMultiShareBackup(): void {
        cy.getTestElement('@settings/device/create-multi-share-backup-button')
            .should('be.visible')
            .click();
        cy.getTestElement('@multi-share-backup/1st-info/submit-button').should('be.visible');
    }
}

export const onSettingsDevicePage = new SettingsDevicePage();
