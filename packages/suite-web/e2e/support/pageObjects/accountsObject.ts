/// <reference types="cypress" />

import { NetworkSymbol } from '@suite-common/wallet-config';

class AccountsPage {
    clickAllAccountArrows() {
        cy.getTestElement('@account-menu/add-account').click({ multiple: true });
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

    openSignandVerify() {
        cy.getTestElement('@wallet/menu/extra-dropdown').click();
        cy.getTestElement('@wallet/menu/wallet-sign-verify').click();
        cy.getTestElement('@sign-verify/submit');
    }

    cycleThroughGraphspan() {
        cy.contains('span', '1D').click({ force: true });
        cy.get('[class*=InfoCard]').contains('1 day').should('be.visible');
        cy.contains('span', '1W').click({ force: true });
        cy.get('[class*=InfoCard]').contains('1 week').should('be.visible');
        cy.contains('span', '1M').click({ force: true });
        cy.get('[class*=InfoCard]').contains('1 month').should('be.visible');
        cy.contains('span', '1Y').click({ force: true });
        cy.get('[class*=InfoCard]').contains('1 year').should('be.visible');
        cy.contains('span', 'All').click({ force: true });
        cy.get('[class*=InfoCard]').contains('All').should('be.visible');
    }

    accountsPaginationCheck() {
        cy.getTestElement('@wallet/accounts/pagination/5')
            .click()
            .invoke('attr', 'data-test-activated')
            .should('eq', 'true');

        cy.getTestElement('@wallet/accounts/pagination/3')
            .click()
            .invoke('attr', 'data-test-activated')
            .should('eq', 'true');
    }

    searchLatestTxAddress() {
        cy.getTestElement(
            '@metadata/outputLabel/81d00a47d55b4df0b7a0793533c337493775ceb7f9ae20789325e25051f3374c-0/hover-container',
        )
            .find('span > span')
            .invoke('text')
            .then(notificationText => {
                cy.log(notificationText);
                cy.getTestElement('@wallet/accounts/search-icon').click({ force: true });
                cy.getTestElement('@wallet/accounts/search-icon').type(notificationText);
                cy.wait(500);
                cy.getTestElement('@wallet/accounts/transaction-list')
                    .children()
                    .should('have.length', 2);
            });
    }

    scrolltoBottomAccountspage() {
        cy.getTestElement('@account-menu/legacy').click({ force: true });
        cy.getTestElement('@account-menu/btc/legacy/0').click({ force: true });
        cy.getTestElement('@app').scrollTo('bottom');
    }

    clickOnDesiredAccount(coinName: NetworkSymbol) {
        cy.getTestElement(`@account-menu/${coinName}/normal/0`).click('left');
    }

    exportDesiredTransactionType(typeOfExport: string) {
        cy.getTestElement('@wallet/accounts/export-transactions/dropdown').click({
            scrollBehavior: false,
        });
        cy.getTestElement(`@wallet/accounts/export-transactions/${typeOfExport}`)
            .should('be.visible')
            .click({
                scrollBehavior: 'center',
            });
    }
}

export const onAccountsPage = new AccountsPage();
