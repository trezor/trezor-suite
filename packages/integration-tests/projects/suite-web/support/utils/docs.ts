/**
 * utility command used to create screenshot with area defined by dataTest param highlighted
 */
export const captureDocScreenshot = (dataTest: string, screenshotOptions?: Cypress.ScreenshotOptions) => {
    cy.getTestElement(dataTest).then(($el) => {
        const origBorder = $el.css('border'); 
        $el.css('border', '4px solid red');
        cy.screenshot(screenshotOptions || {}).then(() => {
            $el.css('border', origBorder);
        });
    })
}
