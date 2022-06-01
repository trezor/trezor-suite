import React from 'react';

import renderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';
import { Translation } from '../Translation';
import { Locale } from '../../languages';

const createComponentWithIntl = (children: React.ReactChild, props?: { locale: Locale }) => {
    const { locale = 'en' } = props || {};

    return renderer.create(
        <IntlProvider {...props} locale={locale}>
            {children}
        </IntlProvider>,
    );
};

const messages = {
    TR_HELLO: {
        id: 'TR_HELLO',
        defaultMessage: 'Hello',
        descriptor: 'test desc',
    },
    TR_HELLO_NAME: {
        id: 'TR_HELLO_NAME',
        defaultMessage: 'Hello {TR_NAME}, {TR_AGE}',
    },
    TR_NAME: {
        id: 'TR_NAME',
        defaultMessage: 'Name: {name}',
    },
    TR_AGE: {
        id: 'TR_NAME',
        defaultMessage: 'Age: {age}',
    },
};

describe('Translation component', () => {
    test('with id, defaultMessage props', () => {
        const component = createComponentWithIntl(<Translation id="TR_CANCEL" />);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with message that holds string in value (passed via props)', () => {
        const component = createComponentWithIntl(
            // @ts-ignore
            <Translation {...messages.TR_NAME} values={{ name: 'John' }} />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with message that holds another message object in values (passed via props)', () => {
        const component = createComponentWithIntl(
            <Translation
                {...messages.TR_HELLO_NAME}
                values={{
                    // @ts-ignore
                    TR_NAME: { ...messages.TR_NAME, values: { name: 'John' } },
                    TR_AGE: 100,
                }}
            />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with message that holds another in values (passed via props)', () => {
        const component = createComponentWithIntl(
            // @ts-ignore
            <Translation
                {...messages.TR_HELLO_NAME}
                values={{
                    // @ts-ignore
                    TR_NAME: <Translation {...messages.TR_NAME} values={{ name: 'John' }} />,
                    TR_AGE: 100,
                }}
            />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});
