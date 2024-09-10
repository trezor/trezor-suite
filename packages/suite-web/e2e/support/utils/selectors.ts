/**
 * Just like cy.get() but will return element specified with 'data-testid=' attribute.
 *
 * @example any element <div data=test="my-fancy-attr-name" />
 * cy.getTestElement('my-fancy-attr-name')
 *
 * @example example Select element
 * <Select data-testid="send/fee-select" options=[{label: 'foo', value: 'bla'}] />
 *
 *  - will get input
 *  getTestElement('send/fee-select/input')
 *
 *  - will get option by its value (something in example)
 *  getTestElement('send/fee-select/option/something')
 */

export const getTestElement = (selector: string, options?: Parameters<typeof cy.get>[1]) =>
    cy.get(`[data-testid="${selector}"]`, options);

export const getConfirmActionOnDeviceModal = () => cy.getTestElement('@prompts/confirm-on-device');

export const hoverTestElement = (selector: string) => cy.getTestElement(selector).realHover();
