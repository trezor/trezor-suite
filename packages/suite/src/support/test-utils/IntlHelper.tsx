import { type ReactElement } from 'react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';

import { type RenderResult, render } from '@testing-library/react';

import { configureMockStore } from '@suite-common/test-utils';

interface Props {
    locale?: string;
}

export const renderWithIntl = (ui: ReactElement, { locale = 'en' }: Props = {}): RenderResult => {
    const store = configureMockStore({
        extra: undefined,
        preloadedState: {},
    });

    return render(
        <Provider store={store}>
            <IntlProvider locale={locale}>{ui}</IntlProvider>
        </Provider>,
    );
};
