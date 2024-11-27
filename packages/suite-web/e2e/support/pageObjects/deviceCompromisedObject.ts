/// <reference types="cypress" />

class DeviceCompromisedModal {
    ignoreDeviceCompromisedWarning() {
        cy.getTestElement('@device-compromised/back-button').click();
    }
}

export const onDeviceCompromisedModal = new DeviceCompromisedModal();
