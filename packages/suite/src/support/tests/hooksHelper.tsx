import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { act, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { ConnectedThemeProvider } from 'src/support/suite/ConnectedThemeProvider';
import userEvent from '@testing-library/user-event';
import { MockedFormatterProvider } from '@suite-common/formatters';

// used in hooks tests
export const renderWithProviders = (store: any, children: ReactNode) => {
    const renderMethods = render(
        <Provider store={store}>
            <ConnectedThemeProvider>
                <IntlProvider locale="en">
                    <MockedFormatterProvider>{children}</MockedFormatterProvider>
                </IntlProvider>
            </ConnectedThemeProvider>
        </Provider>,
    );
    return renderMethods;
};

export const waitForLoader = (text = /Loading/i) => {
    try {
        const loading = screen.queryByText(text);
        if (loading) {
            return waitForElementToBeRemoved(() => screen.queryByText(text), { timeout: 5000 });
        }
    } catch (e) {
        return true;
    }
};

export const waitForRender = (delay = 1) =>
    act(() => new Promise(resolve => setTimeout(resolve, delay)));

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
    expectRerender?: boolean;
};

export const actionSequence = <A extends UserAction[]>(
    actions: A,
    callback?: (action: A[number]) => void,
) => {
    const user = userEvent.setup();

    return actions.reduce(
        (p, action) =>
            p.then(async () => {
                const element = findByTestId(action.element);
                if (action.type === 'hover') {
                    await user.hover(element);
                }
                if (action.type === 'click') {
                    const isDisabled = element.getAttributeNames().includes('disabled');
                    if (isDisabled) {
                        throw new Error('Unable to perform pointer interaction');
                    }

                    await user.click(element);
                } else if (action.type === 'input') {
                    const { value } = action;
                    const typeUser = userEvent.setup(
                        action.delay ? { delay: action.delay } : undefined,
                    );
                    if (!value) {
                        await typeUser.clear(element);
                    } else {
                        await typeUser.type(element, value);
                    }

                    // NOTE: typing or clearing inputs requires extra user action for proper render
                    await user.click(element);
                }

                // wait for compose
                await waitForLoader();

                // in few cases extra render is needed. explained in each fixture
                if (action.expectRerender) {
                    await waitForRender();
                }
                // action complete. run test
                if (callback) callback(action);
            }),
        Promise.resolve(),
    );
};
