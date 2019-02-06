/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import type { MapStateToProps } from 'react-redux';
import type { State } from 'flowtype';

import { IntlProvider, addLocaleData } from 'react-intl';
import en from 'react-intl/locale-data/en';
import de from 'react-intl/locale-data/de';

import messagesEn from '../../translations/en.json';
import messagesDe from '../../translations/de.json';

addLocaleData([...en, ...de]);

const messages = {
    en: messagesEn,
    de: messagesDe,
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
    console.log(locale);
    console.log(messages);
    return (
        <IntlProvider
            locale={locale}
            messages={messages[locale]}
        >
            {children}
        </IntlProvider>
    );
};

export default connect(mapStateToProps, null)(ReactIntlProvider);