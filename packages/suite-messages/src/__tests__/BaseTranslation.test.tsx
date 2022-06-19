import React from 'react';

import renderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';
import { BaseTranslation, TranslationProps } from '../BaseTranslation';

const createComponentWithIntl = (children: React.ReactChild) =>
    renderer.create(<IntlProvider locale="en">{children}</IntlProvider>);

const messages = {
    TR_HELLO: {
        id: 'TR_HELLO',
        defaultMessage: 'Hello',
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
} as const;

type MessageKey = keyof typeof messages;

const Translation = (props: TranslationProps<MessageKey>) => (
    <BaseTranslation messages={messages} {...props} />
);

describe('BaseTranslation component', () => {
    test('with id, defaultMessage props', () => {
        const component = createComponentWithIntl(<Translation id="TR_HELLO" />);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with message that holds string in value (passed via props)', () => {
        const component = createComponentWithIntl(
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
            <Translation
                {...messages.TR_HELLO_NAME}
                values={{
                    TR_NAME: <Translation {...messages.TR_NAME} values={{ name: 'John' }} />,
                    TR_AGE: 100,
                }}
            />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});
