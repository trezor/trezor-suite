// eslint-disable-next-line import/no-extraneous-dependencies
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand({
    failureThreshold: 0.01, // threshold for entire image
    failureThresholdType: 'percent', // percent of image or number of pixels
});

beforeEach(() => {
    cy.document().then(doc => {
        cy.wrap(null).then(() => {
            // return a promise to cy.then() that
            // is awaited until it resolves
            return doc.fonts.ready.then(fontSet => {
                cy.expect(fontSet.status).to.equal('loaded');
            });
        });
    });
});

Cypress.Commands.add('getTestElement', selector => cy.get(`[data-test="${selector}"]`));
