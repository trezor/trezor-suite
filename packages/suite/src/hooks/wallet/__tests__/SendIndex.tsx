/* eslint-disable @typescript-eslint/no-var-requires */
// this is the same as '@wallet-views/send/index' with:
// - exported sendFormContext in callback function to upper scope
// - additional elements which aren't accessible by tests (loader)

import React from 'react';
import { Provider, connect } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { DeepPartial } from 'react-hook-form';
import { act, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SendContext, useSendForm } from '../useSendForm';

import Outputs from '@wallet-views/send/components/Outputs';
import Header from '@wallet-views/send/components/Header';
import Fees from '@wallet-views/send/components/Fees';
import Options from '@wallet-views/send/components/Options';
import TotalSent from '@wallet-views/send/components/TotalSent';
import ReviewButton from '@wallet-views/send/components/ReviewButton';
import { UseSendFormProps, SendContextValues } from '@wallet-types/sendForm';

const mapStateToProps = (state: any) => ({
    selectedAccount: state.wallet.selectedAccount,
    fiat: state.wallet.fiat,
    localCurrency: state.wallet.settings.localCurrency,
    fees: state.wallet.fees,
    online: state.suite.online,
});

interface TestCallback {
    getContextValues?: () => SendContextValues;
}

const Index = (props: UseSendFormProps & { callback: TestCallback }) => {
    const sendContextValues = useSendForm(props);
    props.callback.getContextValues = () => sendContextValues;
    return (
        <SendContext.Provider value={sendContextValues}>
            {sendContextValues.isLoading && <div>Loading</div>}
            <Header />
            <Outputs />
            <Options />
            <Fees />
            <TotalSent />
            <ReviewButton />
        </SendContext.Provider>
    );
};

const ConnectedIndex = connect(mapStateToProps)(Index);

export const waitForLoader = () => {
    const loading = screen.queryByText(/Loading/i);
    if (loading) {
        return waitForElementToBeRemoved(() => screen.getByText(/Loading/i));
    }
};

export function findByTestId(id: string): HTMLElement;
export function findByTestId(id: RegExp): HTMLElement[];
export function findByTestId(id: any) {
    if (typeof id === 'string') {
        return screen.getByText((_, element) => {
            const attrValue = element.getAttribute('data-test');
            return attrValue ? attrValue === id : false;
        });
    }
    return screen.getAllByText((_, element) => {
        const attrValue = element.getAttribute('data-test');
        return attrValue ? id.test(attrValue) : false;
    });
}

export const renderWithCallback = (store: any) => {
    // little hackish, but didn't find a better way how to access nested SendContext.Provider
    // pass callback into Index and create `getContextValues` method inside
    const callback: TestCallback = {};
    const renderMethods = render(
        <Provider store={store}>
            <IntlProvider locale="en">
                <ConnectedIndex callback={callback} />
            </IntlProvider>
        </Provider>,
    );
    return {
        ...renderMethods,
        callback,
    };
};

type Action = {
    type: string;
    element: string;
    value?: string;
    delay?: number;
    result?: Partial<{
        composeTransactionCalls: number;
        composeTransactionParams: any; // partial trezor-connect params
        composedLevels: any; // partial PrecomposedLevel
        formValues: DeepPartial<ReturnType<SendContextValues['getValues']>>;
        errors: any; // partial SendContextValues['errors']
    }>;
};

// Actions sequence execution
// used in multiple test cases
export const actionSequence = async (actions: Action[], callback: TestCallback) => {
    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        if (action.type === 'hover') {
            userEvent.hover(findByTestId(action.element));
        }
        if (action.type === 'click') {
            userEvent.click(findByTestId(action.element));
        } else if (action.type === 'input') {
            const { value } = action;
            if (!value) {
                act(() => userEvent.clear(findByTestId(action.element)));
            } else {
                // eslint-disable-next-line no-await-in-loop
                await act(() =>
                    // @ts-ignore: act => Promise
                    userEvent.type(
                        findByTestId(action.element),
                        value,
                        action.delay ? { delay: action.delay } : undefined,
                    ),
                );
            }
        }

        // wait for compose
        // eslint-disable-next-line no-await-in-loop
        await waitForLoader();

        // validate results
        const { result } = action;
        const { getContextValues } = callback;
        if (result && getContextValues) {
            // eslint-disable-next-line global-require
            const { composeTransaction } = require('trezor-connect').default;
            // validate params sent to 'trezor-connect'
            if (result.composeTransactionParams) {
                expect(composeTransaction).toHaveBeenLastCalledWith(
                    expect.objectContaining(result.composeTransactionParams),
                );
            }
            // validate number of calls to 'trezor-connect'
            if (typeof result.composeTransactionCalls === 'number') {
                expect(composeTransaction).toBeCalledTimes(result.composeTransactionCalls);
            }

            const { composedLevels, getValues, errors } = getContextValues();

            // validate composedLevels object
            if (Object.prototype.hasOwnProperty.call(result, 'composedLevels')) {
                if (result.composedLevels) {
                    expect(composedLevels).toMatchObject(result.composedLevels);
                } else {
                    expect(composedLevels).toBe(undefined);
                }
            }

            // validate form values
            if (result.formValues) {
                expect(getValues()).toMatchObject(result.formValues);
            }

            if (result.errors) {
                expect(errors).toMatchObject(result.errors);
            }
        }
    }
};
