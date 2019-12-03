import React from 'react';
import renderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';

interface Props {
    locale: string;
}

const createComponentWithIntl = (children: React.ReactChild, props?: Props) => {
    const { locale = 'en' } = props || {};
    return renderer.create(
        <IntlProvider {...props} locale={locale}>
            {children}
        </IntlProvider>,
    );
};

export default createComponentWithIntl;
