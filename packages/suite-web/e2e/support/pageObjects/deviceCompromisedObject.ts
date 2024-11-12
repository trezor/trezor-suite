/// <reference types="cypress" />

class DeviceCompromisedModal {
    ignoreDeviceCompromisedWarning() {
        cy.getTestElement('@device-compromised/back-button').should('be.visible').click();
    }
}

export const onDeviceCompromisedModal = new DeviceCompromisedModal();
