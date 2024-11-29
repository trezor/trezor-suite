/// <reference types="cypress" />

class SettingsDevicePage {
    openSeedCheck(): void {
        cy.getTestElement('@settings/device/check-seed-button').click();
    }

    openCreateMultiShareBackup(): void {
        cy.getTestElement('@settings/device/create-multi-share-backup-button').click();
        cy.getTestElement('@multi-share-backup/1st-info/submit-button').should('be.visible');
    }

    togglePinSwitch(): void {
        cy.getTestElement('@settings/device/pin-switch').as('pinSwitch').scrollIntoView();

        cy.get('@pinSwitch').should('be.visible');
        cy.wait(500);
        cy.get('@pinSwitch').click();
    }

    togglePassphraseSwitch(): void {
        cy.getTestElement('@settings/device/passphrase-switch')
            .as('passphraseSwitch')
            .scrollIntoView();

        cy.get('@passphraseSwitch').should('be.visible');
        cy.get('@passphraseSwitch').click();
    }
}

export const onSettingsDevicePage = new SettingsDevicePage();
