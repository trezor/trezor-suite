/**
 * Just like cy.get() but will return element specified with 'data-test=' attribute.
 *
 * @example any element <div data=test="my-fancy-attr-name" />
 * cy.getTestElement('my-fancy-attr-name')
 * 
 * @example example Select element
 * <Select data-test="send/fee-select" options=[{label: 'foo', value: 'bla'}] />
 * 
 *  - will get input
 *  getTestElement('send/fee-select/input')
 * 
 *  - will get option by its value (something in example)
 *  getTestElement('send/fee-select/option/something')
 */


export const getTestElement = (selector: string, options?: Parameters<typeof cy.get>[1]) => {
    return cy.get(`[data-test="${selector}"]`, options);
};

export const getConfirmActionOnDeviceModal = () => {
    return cy.getTestElement('@suite/modal/confirm-action-on-device');
};
