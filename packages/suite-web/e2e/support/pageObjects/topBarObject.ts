/// <reference types="cypress" />

import { NetworkSymbol } from '@suite-common/wallet-config';

class NavBar {
    openDefaultAcccount(coin: NetworkSymbol = 'btc') {
        cy.getTestElement(`@account-menu/${coin}/normal/0`).click();
    }

    openSettings() {
        cy.getTestElement('@suite/menu/settings', { timeout: 30000 }).should('be.visible').click();
        cy.getTestElement('@settings/menu/general').should('be.visible');
    }
}

export const onNavBar = new NavBar();
