import React from 'react';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { act, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { ConnectedThemeProvider } from '@suite-support/ConnectedThemeProvider';
import userEvent from '@testing-library/user-event';

// used in hooks tests
export const renderWithProviders = (store: any, children: React.ReactNode) => {
    const renderMethods = render(
        <Provider store={store}>
            <ConnectedThemeProvider>
                <IntlProvider locale="en">{children}</IntlProvider>
            </ConnectedThemeProvider>
        </Provider>,
    );
    return renderMethods;
};

export const waitForLoader = (text = /Loading/i) => {
    try {
        const loading = screen.queryByText(text);
        if (loading) {
            return waitForElementToBeRemoved(() => screen.queryByText(text));
        }
    } catch (e) {
        return true;
    }
};

export function findByTestId(id: string): HTMLElement;
export function findByTestId(id: RegExp): HTMLElement[];
export function findByTestId(id: any) {
    if (typeof id === 'string') {
        return screen.getByText((_, element) => {
            const attrValue = element?.getAttribute('data-test');
            return attrValue ? attrValue === id : false;
        });
    }
    return screen.getAllByText((_, element) => {
        const attrValue = element?.getAttribute('data-test');
        return attrValue ? id.test(attrValue) : false;
    });
}

// User actions sequence execution

export type UserAction<R = any> = {
    type: string;
    element: string;
    value?: string;
    delay?: number;
    result?: R;
};

export const actionSequence = async <A extends UserAction[]>(
    actions: A,
    callback?: (action: A[number]) => void,
) => {
    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const element = findByTestId(action.element);
        if (action.type === 'hover') {
            userEvent.hover(element);
        }
        if (action.type === 'click') {
            userEvent.click(element);
        } else if (action.type === 'input') {
            const { value } = action;
            if (!value) {
                userEvent.clear(element);
                // eslint-disable-next-line no-await-in-loop
                await waitFor(() => {
                    expect(element).toBeTruthy();
                });
            } else {
                // eslint-disable-next-line no-await-in-loop
                await act(() =>
                    // @ts-ignore: act => Promise
                    userEvent.type(
                        element,
                        value,
                        action.delay ? { delay: action.delay } : undefined,
                    ),
                );
            }
        }

        // wait for compose
        // eslint-disable-next-line no-await-in-loop
        await waitForLoader();

        // action complete. run test
        if (callback) callback(action);
    }
};
