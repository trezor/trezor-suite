/// <reference types="cypress" />

import { Currency } from '../../enums/currency';
import { Language } from '../../enums/language';
import { languageMap } from '../../constants/languageMap';
import { Theme } from '../../enums/theme';

class SettingsGeneral {
    changeFiatCurrency(currency: Currency) {
        cy.getTestElement('@settings/fiat-select/input')
            .should('be.visible')
            .click({ scrollBehavior: 'bottom' });
        cy.getTestElement(`@settings/fiat-select/option/${currency}`).click();
    }

    changeTheme(theme: Theme) {
        cy.getTestElement('@theme/color-scheme-select/input')
            .should('be.visible')
            .click({ scrollBehavior: 'bottom' });
        cy.getTestElement(`@theme/color-scheme-select/option/${theme}`).click();
        cy.getTestElement('@theme/color-scheme-select/input').should(
            'contain',
            Cypress._.capitalize(theme),
        );
    }

    changeLanguage(language: Language) {
        cy.getTestElement('@settings/language-select/input').click({ scrollBehavior: 'bottom' });
        cy.getTestElement(`@settings/language-select/option/${language}`).click({ force: true });
        cy.getTestElement('@settings/language-select/input').should(
            'contain',
            languageMap[language],
        );
    }
}

export const onSettingGeneralPage = new SettingsGeneral();
