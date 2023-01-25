// @group:coinmarket

describe('Coinmarket sell', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
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
        // Goes to Sell
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/regtest/normal/0/label').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();
        cy.getTestElement('@coinmarket/menu/wallet-coinmarket-sell').click();
    });

    /**
     * 1. Navigates to Accounts/REGTEST account/Trade/Sell (account has to be already verified by BTC Direct).
     * 2. Checks:
     *  - all input windows are empty
     *  - crypto input is set on REGTEST
     *  - the mocked API response (country:AT, fiat:EUR).
     * 3. Fills in an amount of 0.005REGTEST or 50EUR a custom fee of 20 sat and clicks “Show offers”.
     * 4. Verifies the mocked API response (only offers from the mocked file).
     * 5. Picks the BTC Direct entry and clicks “Get this Offer”.
     * 6. Verifies that the modal opens, clicks the checkbox and “Confirm”.
     * 7. Checks:
     *  - REGTEST, fiat amount, provider, IBAN, payment method all match the mocked/given data.
     * 8. Clicks “Proceed” in Suite.
     * 9. Checks the address
     * 10. Clicks "Confirm on Trezor & Send".
     * 11. Confirms the transaction and verifies the same information from the step 9. in the modal.
     * 12. Signs the transaction on the Trezor device and holds to confirm.
     * 13. Clicks "Send" in the modal.
     * 14. Checks the toast banner information
     * 15. Returns back to the Sell tab in Trezor Suite and checks the status in the Coinmarket menu
     */
    it('Should sell crypto successfully verified through BTC Direct', () => {
        const testData = {
            cryptoInput: '0.005',
            fiatOutput: '98.12',
            feeInput: '20',
            providerName: 'BTC Direct',
            paidBy: 'Bank Transfer',
            iban: 'MNOP 1234 5678 9012 3456 7890',
        };

        cy.discoveryShouldFinish();
        // Tests all input windows are empty
        cy.getTestElement('@coinmarket/sell/crypto-input').should('have.value', '');
        cy.getTestElement('@coinmarket/sell/fiat-input').should('have.value', '');

        // Tests crypto input contains REGTEST, country is AT and fiat EUR
        cy.getTestElement('@coinmarket/sell/crypto-currency-select/input').should(
            'contain.text',
            'REGTEST',
        );
        cy.getTestElement('@coinmarket/sell/fiat-currency-select/input').should(
            'contain.text',
            'EUR',
        );
        cy.getTestElement('@coinmarket/sell/country-select/input').should(
            'contain.text',
            'Austria',
        );

        // Fills out 0.005REGTEST
        cy.getTestElement('@coinmarket/sell/crypto-input').type(testData.cryptoInput);

        // 20 sat fee setup and transfer to quotes
        cy.getTestElement('select-bar/custom').click();
        cy.getTestElement('feePerUnit').clear().type(testData.feeInput);
        cy.getTestElement('@coinmarket/sell/compare-button').click();

        // Verifies the offers displayed match the mock, this will go through a reconstruction
        cy.getTestElement('@coinmarket/sell/offers/quote-rectangle').then(quoteRectangle => {
            cy.wrap(quoteRectangle)
                .getTestElement('@coinmarket/sell/offers/crypto-amount')
                .should('contain.text', testData.fiatOutput);
            cy.wrap(quoteRectangle)
                .getTestElement('@coinmarket/sell/offers/provider-name')
                .should('contain.text', testData.providerName);
            cy.wrap(quoteRectangle)
                .getTestElement('@coinmarket/sell/offers/paid-by')
                .should('contain.text', testData.paidBy);
        });

        // Gets the deal
        cy.getTestElement('@coinmarket/sell/offers/get-this-deal-button').eq(0).click();
        cy.getTestElement('@modal').should('be.visible');
        cy.getTestElement('@coinmarket/sell/offers/buy-terms-agree-checkbox').click();
        cy.getTestElement('@coinmarket/sell/offers/buy-terms-confirm-button').click();

        // Verifies amounts, currencies, accounts and providers
        cy.getTestElement('@coinmarket/sell/selected-offer/crypto-amount').should(
            'contain.text',
            testData.cryptoInput,
        );
        cy.getTestElement('@coinmarket/sell/selected-offer/fiat-amount').should(
            'contain.text',
            testData.fiatOutput,
        );
        cy.getTestElement('@coinmarket/sell/selected-offer/provider-name').should(
            'contain.text',
            testData.providerName,
        );
        cy.getTestElement('@coinmarket/sell/selected-offer/paid-by').should(
            'contain.text',
            testData.paidBy,
        );
        cy.getTestElement('@coinmarket/sell/selected-offer/iban').should(
            'contain.text',
            testData.iban,
        );

        // Confirming the transaction
        cy.getTestElement('@coinmarket/sell/offers/confirm-on-trezor-button').click();

        // Check the address
        cy.getTestElement('@coinmarket/sell/selected-offer/address').should(
            'contain.text',
            'bcrt1qnspxpr2xj9s2jt6qlhuvdnxw6q55jvyg6q7g5r',
        );
        cy.getTestElement('@coinmarket/sell/offers/continue-transaction-button').click();
        cy.getTestElement('@prompts/confirm-on-device');
        cy.task('pressYes');

        cy.getTestElement('@modal').within(() => cy.contains('20 sat/B'));
        cy.task('pressYes');
        cy.task('pressYes');
        cy.getTestElement('@modal/send').should('not.be.disabled').click();

        // Final check and return to the Sell tab
        cy.getTestElement('@toast/tx-sent').within(() => cy.contains(testData.cryptoInput));
        cy.getTestElement('@coinmarket/sell/payment/back-to-account').click();
        cy.getTestElement('@coinmarket/menu/trade-transactions/status').should(
            'contain.text',
            'Approved',
        );
    });
});

export {};
