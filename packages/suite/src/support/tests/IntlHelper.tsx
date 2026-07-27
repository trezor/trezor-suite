import { type ReactElement } from 'react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';

import { type RenderResult, render } from '@testing-library/react';

import { configureStore } from 'src/support/tests/configureStore';

interface Props {
    locale?: string;
}

export const renderWithIntl = (ui: ReactElement, { locale = 'en' }: Props = {}): RenderResult => {
    const mockStore = configureStore([]);
    const store = mockStore({});

    return render(
        <Provider store={store}>
            <IntlProvider locale={locale}>{ui}</IntlProvider>
        </Provider>,
    );
};
