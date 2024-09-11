/// <reference types="cypress" />

class MultiShareBackupModal {
    createMultiShareBackup(): void {
        cy.getTestElement('@multi-share-backup/checkbox/1').click();
        cy.getTestElement('@multi-share-backup/checkbox/2').click();
        cy.getTestElement('@multi-share-backup/1st-info/submit-button').click();
        cy.getTestElement('@multi-share-backup/2nd-info/submit-button').click();
    }

    finalizeMultiShareBackup(): void {
        cy.getTestElement('@multi-share-backup/done/got-it-button').should('be.visible').click();
    }
}

export const onMultiShareBackupModal = new MultiShareBackupModal();
