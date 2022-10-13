/// <reference types="cypress" />

import { NetworkSymbol } from '@suite-common/wallet-config';

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

    openAddAccountsModal() {
        cy.getTestElement('@account-menu/add-account').click();
        cy.getTestElement('@modal').should('be.visible');
    }

    activatNewCoin(coinName: NetworkSymbol) {
        this.openAddAccountsModal();
        cy.getTestElement('@modal/account/activate_more_coins').click();
        cy.getTestElement(`@settings/wallet/network/${coinName}`).should('be.visible').click();
        cy.contains('button', 'Find my').click();
        cy.getTestElement('@modal').should('not.exist');
        cy.discoveryShouldFinish();
    }
}

export const onAccountsPage = new AccountsPage();
