// @group:wallet
// @retry=2

import { onAccountsPage } from '../../support/pageObjects/accountsObject';
import { onSettingsCryptoPage } from '../../support/pageObjects/settingsCryptoObject';
import { onNavBar } from '../../support/pageObjects/topBarObject';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType, Requests } from '../../support/types';

let requests: Requests;

describe('Account types suite', () => {
    const fixtures = [
        {
            coin: 'btc',
            accounts: [
                { type: 'normal' },
                { type: 'taproot' },
                { type: 'segwit' },
                { type: 'legacy' },
            ],
        },
        {
            coin: 'ltc',
            accounts: [{ type: 'normal' }, { type: 'segwit' }, { type: 'legacy' }],
        },
    ];

    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'town grace cat forest dress dust trick practice hair survey pupil regular',
        });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/settings/coins');

        cy.passThroughInitialRun();
        fixtures
            .filter(({ coin }) => coin !== 'btc')
            .forEach(({ coin }) => {
                cy.getTestElement(`@settings/wallet/network/${coin}`).click();
            });
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.discoveryShouldFinish();

        requests = [];
        cy.interceptDataTrezorIo(requests);
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /**
     * Test case
     * 1. Go to Accounts
     * 2. Unpack all account types
     * 3. Get the number of accounts
     * 4. Create new account for each account type
     * 5. Get the number of accounts again
     * 6. Verify that the current number is equal to previous number + 1
     */
    it(`Add-account-types-btc-like`, () => {
        fixtures.forEach(({ coin, accounts }) => {
            accounts.forEach(({ type }: { type: string }) => {
                //
                // Test execution
                //
                onAccountsPage.clickAllAccountArrows();

                // for a specific type of BTC acc, get the current number of accounts
                cy.getTestElement(`@account-menu/${type}/group`)
                    .children()
                    .not(`[data-test-id="@account-menu/account-item-skeleton"]`)
                    .then(specificAccounts => {
                        const numberOfAccounts1 = specificAccounts.length;

                        // for a specific type of BTC acc, add a new acc
                        cy.createAccountFromMyAccounts(coin, type);

                        // for a specific type of BTC acc, get the current number of accounts again for comparison
                        cy.getTestElement(`@account-menu/${type}/group`)
                            .children()
                            .not(`[data-test-id="@account-menu/account-item-skeleton"]`)
                            .then(specificAccounts => {
                                const numberOfAccounts2 = specificAccounts.length;
                                expect(numberOfAccounts2).to.be.equal(numberOfAccounts1 + 1);
                            });
                    });
                onAccountsPage.clickAllAccountArrows();
            });
        });
    });

    // please @trezor/qa fix this, example how to do this is in the previous test
    /**
     * Test case
     * 1. go to Settings
     * 2. activate ADA and ETH
     * 3. go to Accounts
     * 4. for each coin:
     * 5. Get the number of accounts
     * 6. Create new account
     * 7. Get the number of accounts again
     * 8. Verify that the current number is equal to previous number + 1
     */
    it.skip('Add-account-types-non-BTC-coins', () => {
        //
        // Test execution
        //
        const coins: NetworkSymbol[] = ['ada', 'eth'];

        // activate the coin
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/wallet').click();
        coins.forEach((coin: NetworkSymbol) => {
            onSettingsCryptoPage.activateCoin(coin);
        });

        cy.getTestElement('@suite/menu/suite-index').click();
        onNavBar.openDefaultAcccount();
        cy.discoveryShouldFinish();
        // cardano

        coins.forEach((coin: NetworkSymbol) => {
            onAccountsPage.applyCoinFilter(coin);
            // get the element containing all accounts
            cy.get(`[type="normal"] [data-test-id*="@account-menu/${coin}/normal"]`).then(
                currentAccounts => {
                    const numberOfAccounts1 = currentAccounts.length;

                    cy.getTestElement('@account-menu/add-account').should('be.visible').click();
                    cy.getTestElement('@modal').should('be.visible');
                    cy.get(`[data-test-id="@settings/wallet/network/${coin}"]`)
                        .should('be.visible')
                        .click();
                    cy.getTestElement('@add-account').click();
                    cy.discoveryShouldFinish();

                    cy.get(`[type="normal"] [data-test-id*="@account-menu/${coin}/normal"]`).then(
                        newAccounts => {
                            const numberOfAccounts2 = newAccounts.length;
                            expect(numberOfAccounts2).to.be.equal(numberOfAccounts1 + 1);
                        },
                    );
                },
            );
        });

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.AccountsNewAccount>>(
            requests,
            EventType.AccountsNewAccount,
        ).then(accountsNewAccountEvent => {
            expect(accountsNewAccountEvent.symbol).to.equal('ada'); // ada is first
            expect(accountsNewAccountEvent.path).to.equal(`m/1852'/1815'/1'`);
            expect(accountsNewAccountEvent.type).to.equal('normal'); // normal is first
        });
    });
});

export {};
