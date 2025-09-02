import { IntlProvider as ReactIntlProvider } from 'react-intl';

// direct imports are used to avoid exposing the internal objects from the intl package.
import { messages } from '@suite-native/intl/src/messages';
import { flatten } from '@suite-native/intl/src/utils';

// For uni test we always expect the messages to be in english, so the language selection logic can be omitted here.
export const IntlProviderForTests = ({ children }: { children: React.ReactNode }) => {
    const x = flatten(messages);

    return (
        <ReactIntlProvider locale="en-US" messages={x}>
            {children}
        </ReactIntlProvider>
    );
};
