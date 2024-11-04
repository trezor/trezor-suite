/// <reference types="cypress" />

import { NetworkSymbol } from '@suite-common/wallet-config';

class SettingsCrypto {
    activateCoin(coin: NetworkSymbol) {
        cy.getTestElement(`@settings/wallet/network/${coin}`)
            .click()
            .invoke('attr', 'data-active')
            .should('be.eq', 'true');
    }
}

export const onSettingsCryptoPage = new SettingsCrypto();
