/// <reference types="cypress" />

import { NetworkSymbol } from '../../../../../../suite-common/wallet-config/src/networksConfig';

class AccountsPage {
    unpackAllAccountTypes() {
        cy.getTestElement('@account-menu/arrow').click({ multiple: true });
    }

    applyCoinFilter(coin: NetworkSymbol) {
        cy.getTestElement(`@account-menu/filter/${coin}`)
            .click()
            .invoke('attr', 'data-test-activated')
            .should('eq', 'true');
    }
}

export const onAccountsPage = new AccountsPage();
