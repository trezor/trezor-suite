/// <reference types="cypress" />

import { NetworkSymbol } from '@suite-common/wallet-config';

class SettingsCrypto {
    activateCoin(symbol: NetworkSymbol) {
        cy.getTestElement(`@settings/wallet/network/${symbol}`).as('selectedCoin').click();
        cy.get('@selectedCoin').invoke('attr', 'data-active').should('be.eq', 'true');
    }
}

export const onSettingsCryptoPage = new SettingsCrypto();
