import { Action } from '@suite-types';

/**
 * Clears database. Use it to avoid persistence between tests
 *
 * @example cy.resetDb()
 */
export const resetDb = () => {
    indexedDB.deleteDatabase('trezor-suite');
    // todo: not sure if this is the correct way to make command chainable, probably not, will investigate
    return cy;
};

export const dispatch = (action: Action) => {
    cy.window().its('store').should('exist');
    return cy.window().then(window => {
        window.store.dispatch(action);
    });
};
