/** @jest-environment jsdom */

import { type ReactElement } from 'react';

import { render, screen } from '@testing-library/react';

import { IntlProviderForTests } from '../IntlProviderForTests';
import { Translation } from './Translation';

const renderWithIntl = (component: ReactElement) =>
    render(component, { wrapper: IntlProviderForTests });

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
} as const;

describe('Translation component', () => {
    test('renders id with defaultMessage', () => {
        renderWithIntl(<Translation id="TR_CANCEL" defaultMessage="Cancel" />);
        expect(screen.getByText('Cancel')).toBeDefined();
    });

    test('renders message with string value', () => {
        // @ts-expect-error: fake id for testing
        renderWithIntl(<Translation {...messages.TR_NAME} values={{ name: 'John' }} />);
        expect(screen.getByText('Name: John')).toBeDefined();
    });

    test('renders message with nested messages', () => {
        renderWithIntl(
            // @ts-expect-error: fake id for testing
            <Translation
                {...messages.TR_HELLO_NAME}
                values={{
                    // @ts-expect-error: fake id for testing
                    TR_NAME: <Translation {...messages.TR_NAME} values={{ name: 'John' }} />,
                    TR_AGE: 100,
                }}
            />,
        );
        expect(screen.getByText(/Hello/)).toBeDefined();
    });

    test('renders message with nested Translation components', () => {
        renderWithIntl(
            // @ts-expect-error: fake id for testing
            <Translation
                {...messages.TR_HELLO_NAME}
                values={{
                    // @ts-expect-error: fake id for testing
                    TR_NAME: <Translation {...messages.TR_NAME} values={{ name: 'John' }} />,
                    TR_AGE: 100,
                }}
            />,
        );
        expect(screen.getByText(/Hello/)).toBeDefined();
    });
});
