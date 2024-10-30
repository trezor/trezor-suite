/// <reference types="cypress" />

class ConnectDevicePrompt {
    waitForConnectDevicePrompt() {
        cy.getTestElement('@connect-device-prompt', { timeout: 20000 }).should('be.visible');
    }
}

export const onConnectDevicePrompt = new ConnectDevicePrompt();
