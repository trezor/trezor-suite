import { Action } from '@suite-types';

/**
 * Clears database. Use it to avoid persistence between tests
 *
 * @example cy.resetDb()
 */
export const resetDb = () => {
    const request = indexedDB.deleteDatabase('trezor-suite');

    request.onerror = function () {
        return cy;
    };

    request.onsuccess = function () {
        return cy;
    };
};

export const dispatch = (action: Action) => {
    cy.window().its('store').should('exist');
    return cy.window().then(window => {
        window.store.dispatch(action);
    });
};
