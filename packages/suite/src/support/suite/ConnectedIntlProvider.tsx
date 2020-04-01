/* eslint-disable global-require */
import * as React from 'react';
import { IntlProvider, MessageDescriptor } from 'react-intl';
import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import messages from '@suite/support/messages';

// polyfill for Intl.PluralRules (e.g IE11 & Safari 12-)
if (!Intl.PluralRules) {
    require('@formatjs/intl-pluralrules/polyfill');
    require('@formatjs/intl-pluralrules/dist/locale-data/ru');
    require('@formatjs/intl-pluralrules/dist/locale-data/fr');
    require('@formatjs/intl-pluralrules/dist/locale-data/es');
    require('@formatjs/intl-pluralrules/dist/locale-data/de');
    require('@formatjs/intl-pluralrules/dist/locale-data/cs');
}

// polyfill for Intl.RelativeTimeFormat (e.g IE11, Edge, Safari 13-)
// TODO: TS types are missing Intl.RelativeTimeFormat
// @ts-ignore
if (!Intl.RelativeTimeFormat) {
    require('@formatjs/intl-relativetimeformat/polyfill');
    require('@formatjs/intl-relativetimeformat/dist/locale-data/ru');
    require('@formatjs/intl-relativetimeformat/dist/locale-data/fr');
    require('@formatjs/intl-relativetimeformat/dist/locale-data/es');
    require('@formatjs/intl-relativetimeformat/dist/locale-data/de');
    require('@formatjs/intl-relativetimeformat/dist/locale-data/cs');
}

type PrimitiveType = string | number | boolean | Date | null | undefined;

// Add MessageDescriptor type to values entry
export interface ExtendedMessageDescriptor extends MessageDescriptor {
    id: keyof typeof messages;
    values?: {
        [key: string]: PrimitiveType | React.ReactElement | ExtendedMessageDescriptor;
    };
}

export interface Messages {
    [key: string]: MessageDescriptor;
}

const mapStateToProps = (state: AppState) => ({
    locale: state.suite.settings.language,
    messages: state.suite.messages,
});

interface ReactIntlProps {
    locale: AppState['suite']['settings']['language'];
    messages: AppState['suite']['messages'];
}

const ReactIntlProvider: React.FC<ReactIntlProps> = ({ children, locale, messages }) => (
    <IntlProvider locale={locale} messages={messages}>
        {children}
    </IntlProvider>
);

export default connect(mapStateToProps)(ReactIntlProvider);
