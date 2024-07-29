// @group_other

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
                        '/accounts/coinmarket/buy/offers#/btc/0',
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
    it('Should buy crypto successfully', () => {
        const testData = {
            fiatInput: '500',
            quoteBtcValue: '0.02073954',
            tradeBtcValue: '0.02066953', // real situation: the final trade value may differ from the quote value
            btcAddress: 'bc1q7ceqvaq7fqyywxqcx7qnfxkfk2ykpsla9pe80q',
        };

        // Tests all input windows are empty and country is set to Austria
        cy.getTestElement('@coinmarket/form/country-select/input').should(
            'contain.text',
            'Austria',
        );
        cy.getTestElement('@coinmarket/form/fiat-input').should('have.value', '');

        // Tests set currencies are EUR and BTC
        cy.getTestElement('@coinmarket/form/fiat-currency-select/input').should(
            'contain.text',
            'EUR',
        );

        cy.getTestElement('@coinmarket/form/account-select/input').should('contain.text', 'BTC');

        // Fills out the form
        cy.getTestElement('@coinmarket/form/fiat-input').type(testData.fiatInput, {
            force: true, // The Fiat input contains the inner select box, that partially covers the input.
        });
        cy.getTestElement('@coinmarket/form/compare-button').click();

        // Verifies the offers displayed match the mock
        cy.fixture('./invity/buy/quotes').then((quotes: any) => {
            const bankAccountQuotes = quotes.filter(
                (quote: any) => quote.paymentMethod === 'bankTransfer',
            );
            const exchangeProvider: string[] = ['banxa', 'btcdirect'];

            // Get all displayed quotes
            cy.get('[class*="CoinmarketOffersItem__OfferWrap"]')
                .should('exist')
                // Loop all displayed quotes
                .each(($el, elIndex) => {
                    // Test provider
                    cy.wrap($el)
                        .find('[class*="CoinmarketUtilsProvider__IconWrap"]')
                        .then($el => {
                            const text = $el.text();

                            expect(exchangeProvider).to.include(text);
                        });
                    // Test quote receive amount
                    cy.wrap($el)
                        .find('[class*="FormattedCryptoAmount__Value"]')
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
        cy.getTestElement('@coinmarket/offers/get-this-deal-button').eq(1).click();
        cy.getTestElement('@modal').should('be.visible');
        cy.getTestElement('@coinmarket/buy/offers/buy-terms-confirm-button').click();
        cy.getTestElement('@coinmarket/offer/confirm-on-trezor-button').click();
        cy.getTestElement('@prompts/confirm-on-device');
        cy.task('pressYes');

        // Verifies amounts, currencies and providers
        cy.get('[class*="CoinmarketSelectedOfferInfo__Info"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="CoinmarketSelectedOfferInfo__Dark"]')
                    .first()
                    .invoke('text')
                    .should('match', new RegExp(`€${testData.fiatInput}.[0-9][0-9]`));
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Value"]')
                    .invoke('text')
                    .should('be.equal', testData.quoteBtcValue);
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Container"]')
                    .should('contain.text', 'BTC');
                cy.wrap(wrapper)
                    .find('[class*="CoinmarketProviderInfo__Wrapper"]')
                    .invoke('text')
                    .should('be.equal', 'banxa');
                cy.wrap(wrapper)
                    .find('[class*="CoinmarketPaymentType__Wrapper"]')
                    .invoke('text')
                    .should('be.equal', 'Bank Transfer');
            });

        // Verifies receiving address
        cy.get('[class*="AddressOptions__AddressWrapper"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="AddressOptions__Address"]')
                    .should('have.text', 'bc1q7ceqvaq7fqyywxqcx7qnfxkfk2ykpsla9pe80q');
            });

        // Moving on to the partner's site
        cy.getTestElement('@coinmarket/offer/continue-transaction-button').click();

        // Verifies that the buy trade was approved
        cy.get('[class*="PaymentSuccessful__Wrapper"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="PaymentSuccessful__Title"]')
                    .invoke('text')
                    .should('be.equal', 'Approved');
            });

        // Goes back, then on the Last transactions page after verifies the transaction is listed
        cy.getTestElement('@account-subpage/back').click();
        cy.getTestElement('@coinmarket/menu/wallet-coinmarket-transactions').click();

        cy.get('[class*="BuyTransaction__Wrapper"]')
            .first()
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="HiddenPlaceholder__Wrapper"]')
                    .invoke('text')
                    .should('match', new RegExp(`${testData.fiatInput} EUR`));
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Value"]')
                    .invoke('text')
                    .should('be.equal', testData.tradeBtcValue);
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Container"]')
                    .should('contain.text', 'BTC');
                cy.wrap(wrapper)
                    .find('[class*="CoinmarketProviderInfo__Wrapper"]')
                    .invoke('text')
                    .should('be.equal', 'banxa');
                cy.wrap(wrapper)
                    .find('[class*="CoinmarketPaymentPlainType__Text"]')
                    .should('contain.text', 'Bank Transfer');
                cy.wrap(wrapper)
                    .find('[class*="Status__Text"]')
                    .invoke('text')
                    .should('be.equal', 'Approved');
            });
    });
});

export {};
