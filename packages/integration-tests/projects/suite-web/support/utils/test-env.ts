import { Action } from '@suite-types';

/**
 * Clears database. Use it to avoid persistence between tests
 *
 * @example cy.resetDb()
 */
export const resetDb = () => {
    cy.log('deleting database');
    const request = indexedDB.deleteDatabase('trezor-suite');

    request.onerror = function () {
        cy.log('deleting database error');
        return cy;
    };

    request.onsuccess = function () {
        cy.log('deleting database error success');
        return cy;
    };
};

export const dispatch = (action: Action) => {
    cy.window().its('store').should('exist');
    return cy.window().then(window => {
        window.store.dispatch(action);
    });
};
