import React, { useState } from 'react';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { useForm, FormProvider } from 'react-hook-form';
import { useActions, useSelector } from '@suite/hooks/suite';
import * as coinmarketExchangeActions from '@wallet-actions/coinmarketExchangeActions';
import { useExchangeInfo } from '@suite/hooks/wallet/useCoinmarket';
import { AmountLimits } from '@suite/utils/wallet/coinmarket/exchangeUtils';
import * as routerActions from '@suite-actions/routerActions';
import { Translation } from '@suite-components';
import { ExchangeTradeQuoteRequest } from 'invity-api';
import invityAPI from '@suite/services/invityAPI';

const CoinmarketExchange = () => {
    const methods = useForm({ mode: 'onChange' });
    const { saveExchangeInfo } = useActions({
        saveExchangeInfo: coinmarketExchangeActions.saveExchangeInfo,
    });
    const { exchangeInfo } = useExchangeInfo();
    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const { saveQuoteRequest, saveQuotes } = useActions({
        saveQuoteRequest: coinmarketExchangeActions.saveQuoteRequest,
        saveQuotes: coinmarketExchangeActions.saveQuotes,
    });

    const { goto } = useActions({ goto: routerActions.goto });

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Coinmarket" account={selectedAccount} />;
    }

    saveExchangeInfo(exchangeInfo);

    const { account } = selectedAccount;
    const isLoading = !exchangeInfo.exchangeList || exchangeInfo.exchangeList.length === 0;
    const noProviders =
        exchangeInfo.exchangeList?.length === 0 || !exchangeInfo.sellTickers.has(account.symbol);

    const onSubmit = async () => {
        // const formValues = methods.getValues();
        // const fiatStringAmount = formValues.fiatInput;
        // const cryptoStringAmount = formValues.cryptoInput;
        const request: ExchangeTradeQuoteRequest = {
            receive: 'ETH',
            send: 'BTC',
            sendStringAmount: '1',
        };
        await saveQuoteRequest(request);
        const allQuotes = await invityAPI.getExchangeQuotes(request);
        // const [fixedQuotes, floatQuotes] = processQuotes(allQuotes);
        // const limits = getAmountLimits(request, quotes);
        // if (limits) {
        //     setAmountLimits(limits);
        // } else {
        //     await saveQuotes(fixedQuotes, floatQuotes);
        //     goto('wallet-coinmarket-exchange-offers', {
        //         symbol: account.symbol,
        //         accountIndex: account.index,
        //         accountType: account.accountType,
        //     });
        // }
    };

    return (
        <FormProvider {...methods}>
            <CoinmarketLayout>
                <Wrapper>
                    {isLoading && (
                        <Loading>
                            <Translation id="TR_EXCHANGE_LOADING" />
                        </Loading>
                    )}
                    {!isLoading && noProviders && (
                        <NoProviders>
                            <Translation id="TR_EXCHANGE_NO_PROVIDERS" />
                        </NoProviders>
                    )}
                    {!isLoading && !noProviders && (
                        <Content>
                            <form onSubmit={methods.handleSubmit(onSubmit)}>
                                exchange
                                {/* <Inputs
                                    amountLimits={amountLimits}
                                    setAmountLimits={setAmountLimits}
                                    buyInfo={buyInfo}
                                />
                                <Footer buyInfo={buyInfo} setAmountLimits={setAmountLimits} /> */}
                            </form>
                        </Content>
                    )}
                </Wrapper>
            </CoinmarketLayout>
        </FormProvider>
    );
};

const Wrapper = styled.div``;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 25px;
    flex: 1;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 0;
    }
`;

const Loading = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

const NoProviders = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

export default CoinmarketExchange;
