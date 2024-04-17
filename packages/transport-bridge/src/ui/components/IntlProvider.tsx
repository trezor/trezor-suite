import { ReactNode } from 'react';
import { IntlProvider as IntlProviderComponent } from 'react-intl';

interface IntlProviderProps {
    children: ReactNode;
    locale: string;
    messages: Record<string, string>;
}

export const IntlProvider = ({ children, locale, messages }: IntlProviderProps) => {
    return (
        <IntlProviderComponent
            locale={locale}
            messages={messages}
            onError={err => {
                console.error(err);
            }}
        >
            {children}
        </IntlProviderComponent>
    );
};
