// this is the same as '@wallet-views/send/index' with:
// - exported sendFormContext in callback function to upper scope
// - additional elements which aren't accessible by tests (loader)

import React from 'react';
import { Provider, connect } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';

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
    metadataEnabled: false,
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
