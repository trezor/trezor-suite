/// <reference types="cypress" />

class SettingsDevicePage {
    openSeedCheck(): void {
        cy.getTestElement('@settings/device/check-seed-button').click();
    }

    openCreateMultiShareBackup(): void {
        cy.getTestElement('@settings/device/create-multi-share-backup-button')
            .should('be.visible')
            .click();
        cy.getTestElement('@multi-share-backup/1st-info/submit-button').should('be.visible');
    }

    togglePinSwitch(): void {
        cy.getTestElement('@settings/device/pin-switch').should('be.visible').wait(500).click();
    }

    togglePassphraseSwitch(): void {
        cy.getTestElement('@settings/device/passphrase-switch')
            .as('passphraseSwitch')
            .scrollIntoView();

        cy.get('@passphraseSwitch').should('be.visible').click();
    }
}

export const onSettingsDevicePage = new SettingsDevicePage();
