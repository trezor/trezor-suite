// eslint-disable-next-line import/no-extraneous-dependencies
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand({
    failureThreshold: 0.01, // threshold for entire image
    failureThresholdType: 'percent', // percent of image or number of pixels
});

Cypress.Commands.add('getTestElement', selector =>
    cy
        .get(`[data-test="${selector}"]`)
        .should('exist')
        .should('be.visible')
);

Cypress.Commands.add('loadContent', url => {
    return cy.visit(url).then(() => {
        return cy.document().then(doc => {
            return doc.fonts.ready.then(() => {
                return doc.fonts.load('14px TTHoves');
            });
        });
    });
});
