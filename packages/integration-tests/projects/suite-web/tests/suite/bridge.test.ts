// @group:suite
// @retry=2

const systems = [
    'Linux 64-bit (deb)',
    'Linux 64-bit (rpm)',
    'Linux 32-bit (deb)',
    'Linux 32-bit (rpm)',
    'macOS',
    'Windows',
];

describe('Bridge page', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it('/bridge', () => {
        cy.prefixedVisit('/bridge');

        // it correctly preselects installer by system
        cy.getTestElement('@bridge/installers/input').should('contain', systems[0]);

        // there is a dropdown with installers
        cy.getTestElement('@bridge/installers/input').click()
        systems.forEach(system => {
            cy.getTestElement('@modal').should('contain', system)
        })

        // select listens to keyboard events
        cy.get('body').type('{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{enter}');
        cy.getTestElement('@bridge/installers/input').should('contain', 'Windows');

        cy.getTestElement('@bridge').matchImageSnapshot('bridge modal', {
            blackout: [
                '[data-test="@bridge/download-button"]',
            ]
        });

        // user may exit bridge page and use webusb
        cy.getTestElement('@bridge/goto/wallet-index').click();

        // connect device modal with webusb enabled appears
        cy.getTestElement('@modal/connect-device');

        // linux platforms show udev rules link also
        cy.getTestElement('@modal/connect-device/goto/suite-udev').click();
        cy.getTestElement('@modal/udev').matchImageSnapshot('udev rules modal');

        // udev rules modal is closable via close button
        cy.getTestElement('@modal/close-button').click();
    });
});
