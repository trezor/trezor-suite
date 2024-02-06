// @group:coinmarket

describe.skip('Coinmarket exchange', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.enableRegtestAndGetCoins({
            payments: [
                {
                    address: 'bcrt1qnspxpr2xj9s2jt6qlhuvdnxw6q55jvyg6q7g5r',
                    amount: 1,
                },
            ],
        });

        // Enables ETH account
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/eth').click();
        cy.getTestElement('@settings/menu/close').click();

        // Goes to Exchange
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/regtest/normal/0/label').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();
        cy.getTestElement('@coinmarket/menu/wallet-coinmarket-exchange').click();
    });

    /**
     * Test case
     * 1. Go to Accounts/REGTEST account/Trade/Exchange
     * 2. Check whether all input windows are empty and crypto input is set on REGTEST
     * 3. Exchange 0.005REGTEST for ETH with custom fee of 1 sat
     * 4. Verifies the mocked offers are all fully and correctly displayed
     * 5. Pick one offer
     * 6. Verifies the amounts, currencies, addresses and providers are all in accordance with the mock
     * 7. Confirms the transaction and verifies the same information in the modal
     * 8. Return back to the Exchange tab in Trezor Suite
     */
    it('Should exchange crypto successfully', () => {
        const testData = {
            cryptoInput: '0.005',
            targetCrypto: 'ETH',
            ethValue: '0.053845',
            ethAddress: '0x3f2329C9ADFbcCd9A84f52c906E936A42dA18CB8',
        };

        cy.discoveryShouldFinish();
        // Tests all input windows are empty
        cy.getTestElement('@coinmarket/exchange/crypto-input').should('have.value', '');
        cy.getTestElement('@coinmarket/exchange/fiat-input').should('have.value', '');

        // Tests crypto input contains REGTEST
        cy.getTestElement('@coinmarket/exchange/crypto-currency-select/input').should(
            'contain.text',
            'REGTEST',
        );

        // Fills out 0.005REGTEST and chooses ETH as target crypto */
        cy.getTestElement('@coinmarket/exchange/crypto-input').type(testData.cryptoInput);
        cy.getTestElement('@coinmarket/exchange/receive-crypto-select/input').type('ETH{enter}');

        // Custom fee setup
        cy.getTestElement('select-bar/custom').click();
        cy.getTestElement('feePerUnit').clear().type('1');
        cy.getTestElement('@coinmarket/exchange/compare-button').click();

        // Verifies the offers displayed match the mock
        cy.fixture('./invity/exchange/quotes').then((quotes: any) => {
            const exchangeProvider = [
                ['changehero', 'changehero'],
                ['changenow', 'changenow'],
                ['changelly', 'changelly'],
            ];

            exchangeProvider.forEach((provider: string[]) => {
                // Tests offer accordance with the mocks
                const valueFromFixtures = quotes.find(
                    (quote: any) => quote.exchange === provider[1],
                );
                cy.contains('[class*="Quote__Wrapper"]', provider[0], { matchCase: false })
                    .should('exist')
                    .find('[class*="CryptoAmount__Value"]') // Returns element handle
                    .invoke('text')
                    .then((readValue: string) => {
                        const ethValueFromApp: number = parseFloat(readValue);
                        const ethValueFromQuote: number = parseFloat(
                            valueFromFixtures.receiveStringAmount,
                        );
                        expect(ethValueFromApp).to.be.eq(ethValueFromQuote);
                    });
            });
        });

        // Gets the deal
        cy.getTestElement('@coinmarket/exchange/offers/get-this-deal-button').eq(0).click();
        cy.getTestElement('@modal').should('be.visible');
        cy.getTestElement('@coinmarket/exchange/offers/buy-terms-confirm-button').click();

        // Verifies amounts, currencies and providers
        cy.get('[class*="CoinmarketExchangeOfferInfo__Wrapper"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Value"]')
                    .first()
                    .invoke('text')
                    .should('be.equal', testData.cryptoInput);
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Value"]')
                    .eq(1)
                    .invoke('text')
                    .should('be.equal', testData.ethValue);
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Symbol"]')
                    .first()
                    .should('contain.text', 'REGTEST');
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Symbol"]')
                    .last()
                    .should('contain.text', testData.targetCrypto);
                cy.wrap(wrapper)
                    .find('[class*="CoinmarketProviderInfo__Text"]')
                    .invoke('text')
                    .should('be.equal', 'ChangeHero');
            });

        // Verifies receiving address and its title
        cy.get('[class*="VerifyAddress__Wrapper"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="AccountLabeling__TabularNums"]')
                    .invoke('text')
                    .should('be.equal', 'Ethereum #1');
                cy.wrap(wrapper)
                    .find('[class*="Input__StyledInput"]')
                    .should('have.value', testData.ethAddress);
            });

        // Confirming the transaction
        cy.getTestElement('@coinmarket/exchange/offers/confirm-on-trezor-button').click();
        cy.getTestElement('@prompts/confirm-on-device');
        cy.task('pressYes');
        cy.getTestElement('@coinmarket/exchange/offers/continue-transaction-button').click();
        cy.getTestElement('@coinmarket/exchange/offers/confirm-on-trezor-and-send').click();

        // Verification modal opens
        cy.get('[class*="OutputElement__OutputWrapper"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="OutputElement__OutputHeadline"]')
                    .first()
                    .invoke('text')
                    .should('be.equal', '2N4dH9yn4eYnnjHTYpN9xDmuMRS2k1AHWd8... ');
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Value"]')
                    .first()
                    .invoke('text')
                    .should('be.equal', testData.cryptoInput);
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Symbol"]')
                    .first()
                    .should('contain.text', 'REGTEST');
            });
        cy.getTestElement('@modal').within(() => cy.contains('1 sat/B'));
        cy.task('pressYes');
        cy.task('pressYes');
        cy.getTestElement('@modal/send').should('not.be.disabled').click();

        // Final check and return to the Exchange tab
        cy.getTestElement('@toast/tx-sent').should('be.visible');
        cy.get('[class*="ToastNotification__Wrapper"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="HiddenPlaceholder__Wrapper"]')
                    .invoke('text')
                    .should('be.equal', '0.005 REGTEST');
            });
        cy.get('[class*="PaymentSuccessful__Wrapper"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="PaymentSuccessful__Title"]')
                    .invoke('text')
                    .should('be.equal', 'Approved');
            });
        cy.getTestElement('@coinmarket/exchange/payment/back-to-account').click();
    });
});

export {};
