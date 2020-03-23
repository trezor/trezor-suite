/**
 * Just like cy.get() but will return element specified with 'data-test=' attribute.
 *
 * @example cy.getTestElement('my-fancy-attr-name')
 */


export const getTestElement = (selector: string, options?: Parameters<typeof cy.get>[1]) => {
    return cy.get(`[data-test="${selector}"]`, options);
};

export const getConfirmActionOnDeviceModal = () => {
    return cy.getTestElement('@suite/modal/confirm-action-on-device');
};
