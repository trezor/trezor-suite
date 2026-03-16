import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';

import {
    type RenderResult,
    act,
    render,
    screen,
    waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MockedFormatterProvider } from '@suite-common/formatters';

import { ConnectedThemeProvider } from 'src/support/suite/ConnectedThemeProvider';

import { SuiteServicesProvider } from '../SuiteServicesProvider';
import { type SuiteServices } from '../extraDependencies';
import { ResponsiveContextProvider } from '../suite/ResponsiveContext';

// used in hooks tests
export const renderWithProviders = (
    store: any,
    services: SuiteServices,
    children: ReactNode,
): RenderResult =>
    render(
        <Provider store={store}>
            <SuiteServicesProvider services={services}>
                <ConnectedThemeProvider>
                    <ResponsiveContextProvider>
                        <IntlProvider locale="en">
                            <MockedFormatterProvider>{children}</MockedFormatterProvider>
                        </IntlProvider>
                    </ResponsiveContextProvider>
                </ConnectedThemeProvider>
            </SuiteServicesProvider>
        </Provider>,
    );

export const waitForLoader = (text = /Loading/i) => {
    try {
        const loading = screen.queryByText(text);
        if (loading) {
            return waitForElementToBeRemoved(() => screen.queryByText(text), { timeout: 5000 });
        }
    } catch {
        return true;
    }
};

export const waitForRender = (delay = 1) =>
    act(() => new Promise(resolve => setTimeout(resolve, delay)));

export function findByTestId(id: string): HTMLElement;
export function findByTestId(id: RegExp): HTMLElement[];
/**
 * @deprecated Use screen.findByTestId instead or `import { findByTestId, findAllByTestId } from '@testing-library/react'`
 */
export function findByTestId(id: any) {
    if (typeof id === 'string') {
        return screen.getByTestId(id);
    }

    return screen.getAllByText((_, element) => {
        const attrValue = element?.getAttribute('data-testid');

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

export const actionSequence = async <A extends UserAction[]>(
    actions: A,
    callback?: (action: A[number]) => void,
) => {
    const user = userEvent.setup();

    for (const action of actions) {
        // Use native findByTestId so we can actually see some relevant error info
        const element = await screen.findByTestId(action.element);
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
            const typeUser = userEvent.setup(action.delay ? { delay: action.delay } : undefined);
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
    }
};
