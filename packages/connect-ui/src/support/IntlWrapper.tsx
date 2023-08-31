import { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';

interface IntlWrapperProps {
    children: ReactNode;
}

export const IntlWrapper = ({ children }: IntlWrapperProps) => (
    // todo: so far hardcoded, not implementing real intl yet, so far only code sharing
    // todo: waiting for https://github.com/trezor/trezor-suite/pull/5647
    <IntlProvider
        locale="en"
        defaultLocale="en"
        messages={
            {
                // TR_ENTER_PASSPHRASE_ON_DEVICE: 'something',
            }
        }
    >
        {children}
    </IntlProvider>
);
