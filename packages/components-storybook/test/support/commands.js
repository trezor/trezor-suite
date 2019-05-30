// eslint-disable-next-line import/no-extraneous-dependencies
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand({
    failureThreshold: 0.01, // threshold for entire image
    failureThresholdType: 'percent', // percent of image or number of pixels
});

Cypress.Commands.add('getTestElement', selector => cy.get(`[data-test="${selector}"]`));

Cypress.Commands.overwrite('visit', (orig, url, options) => {
    // eslint-disable-next-line no-param-reassign
    options = options || {};
    // eslint-disable-next-line no-param-reassign
    options.auth = {
        username: Cypress.env('AUTH_USER'),
        password: Cypress.env('AUTH_PASS'),
    };
    return orig(url, options);
});
