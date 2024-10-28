/// <reference types="cypress" />

class Menu {
    openSwitchDevice(): void {
        cy.getTestElement('@menu/switch-device').click();
    }
}

export const onMenu = new Menu();
