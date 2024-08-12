// @group_suite
// @retry=2

describe('Bridge page', () => {
    beforeEach(() => {
        cy.viewport(1440, 2560).resetDb();
    });

    it('/bridge', () => {
        cy.prefixedVisit('/bridge');

        cy.getTestElement('@modal/bridge').matchImageSnapshot('bridge-modal-new', {
            blackout: ['[data-testid="@bridge/download-button"]'],
        });

        // user may exit bridge page and use webusb
        cy.getTestElement('@bridge/goto/wallet-index').click();

        // connect device prompt with webusb enabled appears
        cy.getTestElement('@connect-device-prompt');
    });
});

export {};
