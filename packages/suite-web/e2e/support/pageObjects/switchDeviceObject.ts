/// <reference types="cypress" />

class SwitchDevice {
    private readonly walletSelectorBeginPart = '[data-testid^="@metadata/walletLabel/"]';

    openDevice(index: number) {
        cy.getTestElement(`@switch-device/wallet-on-index/${index}`).click();
    }

    getLabel(index: number): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.get(`${this.walletSelectorBeginPart}[data-testid$=":${index + 1}"]`);
    }

    clickAddLabel(index: number) {
        cy.wait(2000); // TODO fix waiting for animation
        this.hoverAndCheck(
            index,
            `${this.walletSelectorBeginPart}[data-testid$=":${index + 1}/add-label-button"]`,
        );
        cy.get(
            `${this.walletSelectorBeginPart}[data-testid$=":${index + 1}/add-label-button"]`,
        ).click();
    }

    clickEditLabel(index: number) {
        cy.wait(2000); // TODO fix waiting for animation
        this.hoverAndCheck(
            index,
            `${this.walletSelectorBeginPart}[data-testid$=":${index + 1}/edit-label-button"]`,
        );
        cy.get(
            `${this.walletSelectorBeginPart}[data-testid$=":${index + 1}/edit-label-button"]`,
        ).click();
    }

    typeLabel(label: string) {
        cy.getTestElement('@metadata/input').as('metadataInput').clear();
        cy.get('@metadataInput').type(label);
        cy.get('@metadataInput').type('{enter}');
    }

    private hoverAndCheck(index: number, checkSelector: string, retryCount = 2) {
        if (retryCount === 0) {
            throw new Error(`Failed to make the ${checkSelector} visible`);
        }

        cy.get(
            `${this.walletSelectorBeginPart}[data-testid$=":${index + 1}/hover-container"]`,
        ).realHover();
        cy.get(checkSelector).then($el => {
            if (!$el.is(':visible')) {
                cy.log(`Retrying hover and check for index ${index}`);
                this.hoverAndCheck(index, checkSelector, retryCount - 1);
            }
        });
    }
}

export const onSwitchDeviceModal = new SwitchDevice();
