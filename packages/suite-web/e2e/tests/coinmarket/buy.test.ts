// @group_other

function setupAndAssertBuy(selectOffer: () => void) {
    const testData = {
        fiatInput: '500',
        quoteBtcValue: '0.02073954',
        tradeBtcValue: '0.02066953', // real situation: the final trade value may differ from the quote value
        btcAddress: 'bc1q7ceqvaq7fqyywxqcx7qnfxkfk2ykpsla9pe80q',
    };

    // Tests all input windows are empty and country is set to Austria
    cy.getTestElement('@coinmarket/form/country-select/input').should('contain.text', 'Austria');
    cy.getTestElement('@coinmarket/form/fiat-input').should('have.value', '');

    // Tests set currencies are EUR and BTC
    cy.getTestElement('@coinmarket/form/fiat-currency-select/input').should('contain.text', 'EUR');

    cy.getTestElement('@coinmarket/form/select-crypto/input').should('contain.text', 'BTC');

    // Fills out the form
    cy.getTestElement('@coinmarket/form/fiat-input').type(testData.fiatInput, {
        force: true, // The Fiat input contains the inner select box, that partially covers the input.
    });

    selectOffer();

    cy.getTestElement('@modal').should('be.visible');
    cy.getTestElement('@coinmarket/buy/offers/buy-terms-confirm-button').click();
    cy.getTestElement('@coinmarket/offer/confirm-on-trezor-button').click();
    cy.getTestElement('@prompts/confirm-on-device');
    cy.task('pressYes');

    // Verifies info on the confirmation page
    cy.getTestElement('@coinmarket/form/info').should('exist');
    // Verifies fiat amount
    cy.getTestElement('@coinmarket/form/info/fiat-amount')
        .invoke('text')
        .should('match', new RegExp(`€${testData.fiatInput}.[0-9][0-9]`));
    // Verifies crypto amount
    cy.getTestElement('@coinmarket/form/info/crypto-amount').should(
        'contain.text',
        testData.quoteBtcValue,
    );
    // Verifies fiat amount ticker
    cy.getTestElement('@coinmarket/form/info/crypto-amount').should('contain.text', 'BTC');
    // Verifies fiat provider
    cy.getTestElement('@coinmarket/form/info/provider').invoke('text').should('be.equal', 'banxa');
    // Verifies fiat payment method
    cy.getTestElement('@coinmarket/form/info/payment-method')
        .invoke('text')
        .should('be.equal', 'Bank Transfer');
    // Verifies receiving address
    cy.getTestElement('@coinmarket/form/verify/address')
        .invoke('text')
        .should('be.equal', 'bc1q7ceqvaq7fqyywxqcx7qnfxkfk2ykpsla9pe80q');

    // Moving on to the partner's site
    cy.getTestElement('@coinmarket/offer/continue-transaction-button').click();

    // Verifies that the buy trade was approved
    cy.getTestElement('@coinmarket/detail/success').invoke('text').should('be.equal', 'Approved');

    // Goes back, then on the Last transactions page after verifies the transaction is listed
    cy.getTestElement('@account-subpage/back').click();
    cy.getTestElement('@coinmarket/menu/wallet-coinmarket-transactions').click();

    // Verifies fiat amount
    cy.getTestElement('@coinmarket/transaction/fiat-amount')
        .invoke('text')
        .should('match', new RegExp(`${testData.fiatInput} EUR`));
    // Verifies crypto amount
    cy.getTestElement('@coinmarket/transaction/crypto-amount').should(
        'contain.text',
        testData.tradeBtcValue,
    );
    // Verifies fiat amount ticker
    cy.getTestElement('@coinmarket/transaction/crypto-amount').should('contain', 'BTC');
    // Verifies fiat provider
    cy.getTestElement('@coinmarket/form/info/provider').invoke('text').should('be.equal', 'banxa');
    // Verifies fiat payment method
    cy.getTestElement('@coinmarket/form/info/payment-method')
        .invoke('text')
        .should('be.equal', 'Bank Transfer');

    cy.getTestElement('@coinmarket/transaction/status')
        .invoke('text')
        .should('be.equal', 'Approved');
}

describe('Coinmarket buy', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(() => {
                    let { href } = win.location;
                    // simulate redirect from partner back to Suite, prefix independent
                    href = href.replace(
                        new RegExp('/accounts/coinmarket/buy(/confirm)?#/btc/0'),
                        '/coinmarket-redirect#detail/btc/normal/0/mockedPaymentId3',
                    );
                    win.location.href = href;
                });
            },
        });
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        // navigate to buy
        cy.getTestElement('@account-menu/btc/normal/0').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();
    });

    /**
     * 1. Navigates to Trade/Buy.
     * 2. Verifies the mocked API response (country:AT).
     * 3. Fills in an amount and clicks “Compare all offers”.
     * 4. Verifies the mocked API response (only offers from the mocked file, e.g. banxa, btcdirect).
     * 5. Picks one offer and clicks “Get this deal”.
     * 6. Verifies that a modal opens.
     * 7. Clicks the checkbox and “Confirm”.
     * 8. Clicks “Confirm on Trezor”  in Suite and on the emulator.
     * 9. Verifies “Confirmed on Trezor” text.
     * 10. Verifies the amount, currency, crypto, provider and payment method all match the mocked/given data.
     * 11. Clicks “Finish transaction”.
     * 12. Simulates interaction with the partner's site
     * 13. Verifies that the buy trade was approved
     * * 14. Goes back to the Buy tab and verifies the transaction is listed under "Trade transactions"
     */
    it('Should buy crypto with comparing all offers successfully', () => {
        setupAndAssertBuy(() => {
            // Wait for input delay after pass the amount, delay is 500ms
            cy.wait(1000);

            cy.getTestElement('@coinmarket/form/compare-button').click();

            // Verifies the offers displayed match the mock
            cy.fixture('./invity/buy/quotes').then((quotes: any) => {
                const bankAccountQuotes = quotes.filter(
                    (quote: any) => quote.paymentMethod === 'bankTransfer',
                );
                const exchangeProvider: string[] = ['banxa', 'btcdirect'];

                // Get all displayed quotes
                cy.getTestElement('@coinmarket/offers/quote')
                    .should('exist')
                    // Loop all displayed quotes
                    .each(($el, elIndex) => {
                        // Test provider
                        cy.wrap($el)
                            .find('[data-testid="@coinmarket/offers/quote/provider"]')
                            .then($el => {
                                const text = $el.text();

                                expect(exchangeProvider).to.include(text);
                            });
                        // Test quote receive amount
                        cy.wrap($el)
                            .find('[data-testid="@coinmarket/offers/quote/crypto-amount"]')
                            .invoke('text')
                            .then((readValue: string) => {
                                const coinValueFromApp: number = parseFloat(readValue);
                                const coinValueFromQuote: number = parseFloat(
                                    bankAccountQuotes[elIndex].receiveStringAmount,
                                );

                                expect(coinValueFromApp).to.be.eq(coinValueFromQuote);
                            });
                    });
            });
            // Gets the deal
            cy.getTestElement('@coinmarket/offers/get-this-deal-button').eq(0).click();
        });
    });

    /**
     * 1. Navigates to Trade/Buy.
     * 2. Verifies the mocked API response (country:AT).
     * 3. Fills in an amount and clicks “Buy”.
     * 4. Verifies that a modal opens.
     * 5. Clicks the checkbox and “Confirm”.
     * 6. Clicks “Confirm on Trezor”  in Suite and on the emulator.
     * 7. Verifies “Confirmed on Trezor” text.
     * 8. Verifies the amount, currency, crypto, provider and payment method all match the mocked/given data.
     * 9. Clicks “Finish transaction”.
     * 10. Simulates interaction with the partner's site
     * 11. Verifies that the buy trade was approved
     * * 12. Goes back to the Buy tab and verifies the transaction is listed under "Trade transactions"
     */
    it('Should buy crypto best offer successfully', () => {
        setupAndAssertBuy(() => {
            cy.getTestElement('@coinmarket/form/buy-button').click();
        });
    });
});

export {};
