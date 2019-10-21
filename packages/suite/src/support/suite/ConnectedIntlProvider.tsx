/* eslint-disable global-require */
import * as React from 'react';
import { IntlProvider, MessageDescriptor } from 'react-intl';
import { connect } from 'react-redux';
import { AppState } from '@suite-types';

// polyfill for Intl.PluralRules (e.g IE11 & Safari 12-)
if (!Intl.PluralRules) {
    require('@formatjs/intl-pluralrules/polyfill');
    require('@formatjs/intl-pluralrules/dist/locale-data/zh');
    require('@formatjs/intl-pluralrules/dist/locale-data/uk');
    require('@formatjs/intl-pluralrules/dist/locale-data/ru');
    require('@formatjs/intl-pluralrules/dist/locale-data/pt');
    require('@formatjs/intl-pluralrules/dist/locale-data/nl');
    require('@formatjs/intl-pluralrules/dist/locale-data/ja');
    require('@formatjs/intl-pluralrules/dist/locale-data/it');
    require('@formatjs/intl-pluralrules/dist/locale-data/id');
    require('@formatjs/intl-pluralrules/dist/locale-data/fr');
    require('@formatjs/intl-pluralrules/dist/locale-data/es');
    require('@formatjs/intl-pluralrules/dist/locale-data/el');
    require('@formatjs/intl-pluralrules/dist/locale-data/de');
    // TODO: bn is missing
    // require('@formatjs/intl-pluralrules/dist/locale-data/bn');
    require('@formatjs/intl-pluralrules/dist/locale-data/cs');
    require('@formatjs/intl-pluralrules/polyfill-locales');
}

// polyfill for Intl.RelativeTimeFormat (e.g IE11, Edge, Safari 13-)
// TODO: TS types are missing Intl.RelativeTimeFormat
// if (!Intl.RelativeTimeFormat) {
require('@formatjs/intl-relativetimeformat/polyfill');
require('@formatjs/intl-relativetimeformat/dist/locale-data/zh');
require('@formatjs/intl-relativetimeformat/dist/locale-data/uk');
require('@formatjs/intl-relativetimeformat/dist/locale-data/ru');
require('@formatjs/intl-relativetimeformat/dist/locale-data/pt');
require('@formatjs/intl-relativetimeformat/dist/locale-data/nl');
require('@formatjs/intl-relativetimeformat/dist/locale-data/ja');
require('@formatjs/intl-relativetimeformat/dist/locale-data/it');
require('@formatjs/intl-relativetimeformat/dist/locale-data/id');
require('@formatjs/intl-relativetimeformat/dist/locale-data/fr');
require('@formatjs/intl-relativetimeformat/dist/locale-data/es');
require('@formatjs/intl-relativetimeformat/dist/locale-data/el');
require('@formatjs/intl-relativetimeformat/dist/locale-data/de');
// require('@formatjs/intl-relativetimeformat/dist/locale-data/bn');
require('@formatjs/intl-relativetimeformat/dist/locale-data/cs');

// Add MessageDescriptor type to values entry
export interface ExtendedMessageDescriptor extends MessageDescriptor {
    values?: {
        [key: string]: string | React.ReactElement | MessageDescriptor;
    };
}

export interface Messages {
    [key: string]: MessageDescriptor;
}

const mapStateToProps = (state: AppState) => ({
    locale: state.suite.language,
    messages: state.suite.messages,
});

interface ReactIntlProps {
    locale: AppState['suite']['language'];
    messages: AppState['suite']['messages'];
}

const ReactIntlProvider: React.FC<ReactIntlProps> = ({ children, locale, messages }) => (
    <IntlProvider locale={locale} messages={messages}>
        {children}
    </IntlProvider>
);

export default connect(mapStateToProps)(ReactIntlProvider);
