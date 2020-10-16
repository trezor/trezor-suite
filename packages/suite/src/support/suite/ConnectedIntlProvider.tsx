/* eslint-disable global-require */
import * as React from 'react';
import { IntlProvider, MessageDescriptor } from 'react-intl';
import { useSelector } from '@suite-hooks/useSelector';
import messages from '@suite/support/messages';

// TODO: removes polyfills as we are not gonna support these browsers anyway
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

const ConnectedIntlProvider: React.FC = ({ children }) => {
    const { locale, messages } = useSelector(state => ({
        locale: state.suite.settings.language,
        messages: state.suite.messages,
    }));
    return (
        <IntlProvider locale={locale} messages={messages}>
            {children}
        </IntlProvider>
    );
};

export default ConnectedIntlProvider;
