import React from 'react';
import createComponentWithIntl from 'src/support/tests/IntlHelper';
import { Translation } from '../Translation';

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
            // @ts-expect-error
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
                    // @ts-expect-error
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
            // @ts-expect-error
            <Translation
                {...messages.TR_HELLO_NAME}
                values={{
                    // @ts-expect-error
                    TR_NAME: <Translation {...messages.TR_NAME} values={{ name: 'John' }} />,
                    TR_AGE: 100,
                }}
            />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});
