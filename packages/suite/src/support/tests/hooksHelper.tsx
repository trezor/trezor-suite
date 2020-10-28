import React from 'react';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { render } from '@testing-library/react';

// do not render svg files
jest.mock('react-svg', () => {
    return { ReactSVG: () => 'SVG' };
});

// render only Translation['id']
jest.mock('@suite-components/Translation', () => {
    return { Translation: ({ id }: any) => id };
});

// used in hooks tests
export const renderWithProviders = (store: any, children: React.ReactNode) => {
    const renderMethods = render(
        <Provider store={store}>
            <IntlProvider locale="en">{children}</IntlProvider>
        </Provider>,
    );
    return renderMethods;
};
