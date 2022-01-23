import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand({
    failureThreshold: 0.03, // threshold for entire image
    failureThresholdType: 'percent', // percent of image or number of pixels
    customDiffConfig: { threshold: 0.1 }, // threshold for each pixel
});

Cypress.Commands.add('getTestElement', selector =>
    cy.get(`[data-test="${selector}"]`).should('exist').should('be.visible'),
);

Cypress.Commands.add('loadContent', url =>
    cy.visit(url).then(() =>
        cy.document().then(doc =>
            doc.fonts.ready.then(() => {
                cy.wait(200);
                return doc.fonts.load('14px "TT Hoves"');
            }),
        ),
    ),
);
