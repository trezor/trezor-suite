// eslint-disable-next-line import/no-extraneous-dependencies
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand({
    failureThreshold: 0.01, // threshold for entire image
    failureThresholdType: 'percent', // percent of image or number of pixels
});

beforeEach(() => {
    cy.document().then(doc => {
        cy.expect(doc.fonts.status).to.equal('loaded');
    });
});

Cypress.Commands.add('getTestElement', selector => cy.get(`[data-test="${selector}"]`));
