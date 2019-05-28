import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand();

Cypress.Commands.add('getTestElement', selector => cy.get(`[data-test="${selector}"]`));
