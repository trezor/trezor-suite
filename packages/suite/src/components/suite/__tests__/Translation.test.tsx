import React from 'react';
import createComponentWithIntl from '../../../support/tests/IntlHelper';
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
    test('with string as a children', () => {
        const component = createComponentWithIntl(<Translation>test</Translation>);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with ReactNode as a children', () => {
        const component = createComponentWithIntl(
            <Translation>
                <div>test</div>
            </Translation>,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with id, defaultMessage props', () => {
        const component = createComponentWithIntl(<Translation id="TR_HELLO" />);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with message that holds string in value (passed via props)', () => {
        const component = createComponentWithIntl(
            <Translation id="TR_NAME} values={{ name: 'John' }" />,
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
                    TR_NAME: (
                        <Translation>
                            {{ ...messages.TR_NAME, values: { name: 'John' } }}
                        </Translation>
                    ),
                    TR_AGE: 100,
                }}
            />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with message that holds another message object in values (passed via children)', () => {
        const component = createComponentWithIntl(
            <Translation>
                {{
                    ...messages.TR_HELLO_NAME,
                    values: {
                        TR_NAME: { ...messages.TR_NAME, values: { name: 'John' } },
                        TR_AGE: 100,
                    },
                }}
            </Translation>,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});
