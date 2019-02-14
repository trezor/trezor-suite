/* eslint-disable global-require */
/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import type { MapStateToProps } from 'react-redux';
import type { State } from 'flowtype';

import { IntlProvider, addLocaleData } from 'react-intl';

// import { LANGUAGE } from 'config/variables';

import en from 'react-intl/locale-data/en';
import cs from 'react-intl/locale-data/cs';
import bn from 'react-intl/locale-data/bn';
import de from 'react-intl/locale-data/de';
import el from 'react-intl/locale-data/el';
import es from 'react-intl/locale-data/es';
import fr from 'react-intl/locale-data/fr';
import id from 'react-intl/locale-data/id';
import it from 'react-intl/locale-data/it';
import ja from 'react-intl/locale-data/ja';
import nl from 'react-intl/locale-data/nl';
import pl from 'react-intl/locale-data/pl';
import pt from 'react-intl/locale-data/pt';
import ru from 'react-intl/locale-data/ru';
import uk from 'react-intl/locale-data/uk';
import zh from 'react-intl/locale-data/zh';

addLocaleData([...en, ...cs, ...bn, ...de, ...el, ...es, ...fr, ...id, ...it, ...ja, ...nl, ...pl, ...pt, ...ru, ...uk, ...zh]);

const messages = {
    en: require('public/l10n/en.json'),
    bn: require('public/l10n/bn.json'),
    cs: require('public/l10n/cs.json'),
    de: require('public/l10n/de.json'),
    el: require('public/l10n/el.json'),
    es: require('public/l10n/es-ES.json'),
    fr: require('public/l10n/fr.json'),
    id: require('public/l10n/id.json'),
    it: require('public/l10n/it.json'),
    ja: require('public/l10n/ja.json'),
    nl: require('public/l10n/nl.json'),
    pl: require('public/l10n/pl.json'),
    pt: require('public/l10n/pt-PT.json'),
    ru: require('public/l10n/ru.json'),
    uk: require('public/l10n/uk.json'),
    zh: require('public/l10n/zh-CN.json'),
    zh_TW: require('public/l10n/zh-TW.json'),
};

type OwnProps = {
    children: React.Node
}

type StateProps = {
    locale: string
}

type Props = StateProps & OwnProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    locale: state.wallet.language,
});


const ReactIntlProvider = ({ children, locale }: Props) => {
    // const localeData = await import(`react-intl/locale-data/${locale}`);
    // addLocaleData(localeData);
    const localeMessages = messages[locale];
    console.log(locale);
    return (
        <IntlProvider
            key={locale}
            locale={locale}
            messages={localeMessages}
        >
            {children}
        </IntlProvider>
    );
};

export default connect(mapStateToProps, null)(ReactIntlProvider);