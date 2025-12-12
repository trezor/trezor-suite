import { IntlProvider as ReactIntlProvider } from 'react-intl';

import { messages } from './messages';
import { flatten } from './utils';

// For uni test we always expect the messages to be in english, so the language selection logic can be omitted here.
export const IntlProviderForTests = ({ children }: { children: React.ReactNode }) => {
    const x = flatten(messages);

    return (
        <ReactIntlProvider locale="en-US" messages={x}>
            {children}
        </ReactIntlProvider>
    );
};
