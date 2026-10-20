import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import { IntlProvider } from 'react-intl';

import { messages } from './messages';

interface Props extends PropsWithChildren {
    locale?: string;
}

/**
 * Flattens messages from `defineMessages` format to `{ id: defaultMessage }` for react-intl.
 * For unit tests we always expect the messages to be in English, so the language selection logic can be omitted here.
 */
const flattenMessages = (msgs: typeof messages): Record<string, string> =>
    Object.fromEntries(
        Object.values(msgs).map(({ id, defaultMessage }) => [id, defaultMessage as string]),
    );

export const IntlProviderForTests = ({ children }: Props) => {
    const flatMessages = useMemo(() => flattenMessages(messages), []);

    return (
        <IntlProvider locale="en" messages={flatMessages}>
            {children}
        </IntlProvider>
    );
};
