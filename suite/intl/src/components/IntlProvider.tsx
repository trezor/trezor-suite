import { type ReactNode, useMemo } from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';

import type { Locale } from '@suite-common/suite-types';
import { isDevEnv } from '@suite-common/suite-utils';

import { useIntlMessages } from '../hooks/useIntlMessages';
import { messages as definedMessages } from '../messages';
import { getEffectiveIntlMessages } from '../utils/getEffectiveIntlMessages';

const DEFINED_MESSAGE_IDS = Object.keys(definedMessages);

type IntlProviderProps = {
    locale: Locale;
    showTranslationKeys: boolean;
    children: ReactNode;
};

export const IntlProvider = ({ locale, showTranslationKeys, children }: IntlProviderProps) => {
    const messages = useIntlMessages(locale);
    const effectiveMessages = useMemo(
        () =>
            getEffectiveIntlMessages({
                localizedMessages: messages,
                definedMessageIds: DEFINED_MESSAGE_IDS,
                showTranslationKeys,
            }),
        [messages, showTranslationKeys],
    );

    return (
        <ReactIntlProvider
            locale={locale}
            messages={effectiveMessages}
            onError={err => {
                if (isDevEnv) {
                    // ignore, this expected
                    if (err.message.includes('MISSING_TRANSLATION')) {
                        return;
                    }
                    console.error(err);
                }
            }}
        >
            {children}
        </ReactIntlProvider>
    );
};
