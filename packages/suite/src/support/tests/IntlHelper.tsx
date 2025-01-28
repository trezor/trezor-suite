import { ReactChild } from 'react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';

import { configureStore } from 'src/support/tests/configureStore';

interface Props {
    locale: string;
}

const createComponentWithIntl = (children: ReactChild, props?: Props) => {
    const { locale = 'en' } = props || {};

    // Mock store because our custom wrapper around FormattedMessage (Translation component)
    // imports TooltipHelper that depends on accessing the redux store
    const mockStore = configureStore([]);
    const store = mockStore({
        suite: {
            settings: {
                debug: {
                    translationMode: false,
                },
            },
        },
    });

    return renderer.create(
        <Provider store={store}>
            <IntlProvider {...props} locale={locale}>
                {children}
            </IntlProvider>
        </Provider>,
    );
};

export default createComponentWithIntl;
