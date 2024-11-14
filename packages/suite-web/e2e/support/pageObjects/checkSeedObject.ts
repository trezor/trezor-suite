/// <reference types="cypress" />

import { SeedCheckType } from '../enums/seedCheckType';

class CheckSeedPage {
    initCheck(type: SeedCheckType, numOfWords: 12 | 24): void {
        cy.getTestElement('@recovery/user-understands-checkbox').click();
        cy.getTestElement('@recovery/start-button').click();
        cy.getTestElement(`@recover/select-count/${numOfWords}`).click();
        cy.getTestElement(`@recover/select-type/${type}`).click();
    }

    verifyCheckSuccessful(): void {
        cy.getTestElement('@recovery/success-title').should('be.visible');
    }
}

export const onCheckSeedPage = new CheckSeedPage();
