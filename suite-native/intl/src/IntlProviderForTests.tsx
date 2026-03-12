import { IntlProvider as ReactIntlProvider } from 'react-intl';

import { messages } from './messages';
import { flatten } from './utils';

// Memoize outside the component to avoid recomputing on every render.
const flatMessages = flatten(messages);

// For unit tests we always expect the messages to be in english, so the language selection logic can be omitted here.
export const IntlProviderForTests = ({ children }: { children: React.ReactNode }) => (
    <ReactIntlProvider locale="en-US" messages={flatMessages}>
        {children}
    </ReactIntlProvider>
);
