/**
 * Just like cy.get() but will return element specified with 'data-test=' attribute.
 *
 * @example cy.getTestElement('my-fancy-attr-name')
 */
export const getTestElement = (selector: string) => {
    return cy.get(`[data-test="${selector}"]`);
};
