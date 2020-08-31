import React, { useState } from 'react';
import { useSelector, useActions } from '@suite-hooks';
import { variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import { useBuyInfo } from '@wallet-hooks/useCoinmarket';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import { AmountLimits, getAmountLimits, processQuotes } from '@wallet-utils/coinmarket/buyUtils';
import { useForm, FormProvider } from 'react-hook-form';
import styled from 'styled-components';
import * as routerActions from '@suite-actions/routerActions';
import invityAPI from '@suite-services/invityAPI';
import { BuyTradeQuoteRequest } from 'invity-api';
import Inputs from './components/Inputs';
import Footer from './components/Footer';

const CoinmarketBuy = () => {
    const methods = useForm({ mode: 'onChange' });
    const { saveBuyInfo } = useActions({ saveBuyInfo: coinmarketBuyActions.saveBuyInfo });
    const { buyInfo } = useBuyInfo();
    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const { saveQuoteRequest, saveQuotes } = useActions({
        saveQuoteRequest: coinmarketBuyActions.saveQuoteRequest,
        saveQuotes: coinmarketBuyActions.saveQuotes,
    });

    const { goto } = useActions({ goto: routerActions.goto });

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Coinmarket" account={selectedAccount} />;
    }

    saveBuyInfo(buyInfo);

    const { account } = selectedAccount;
    const isLoading = !buyInfo?.buyInfo;
    const noProviders =
        buyInfo.buyInfo?.providers.length === 0 ||
        !buyInfo.supportedCryptoCurrencies.has(account.symbol);

    const onSubmit = async () => {
        const formValues = methods.getValues();
        const fiatStringAmount = formValues.fiatInput;
        const cryptoStringAmount = formValues.cryptoInput;
        const wantCrypto = !fiatStringAmount;
        const request: BuyTradeQuoteRequest = {
            wantCrypto,
            fiatCurrency: formValues.currencySelect.value.toUpperCase(),
            receiveCurrency: formValues.cryptoSelect.value,
            country: formValues.countrySelect.value,
            fiatStringAmount,
            cryptoStringAmount,
        };
        await saveQuoteRequest(request);
        const allQuotes = await invityAPI.getBuyQuotes(request);
        const [quotes, alternativeQuotes] = processQuotes(allQuotes);
        const limits = getAmountLimits(request, quotes);

        if (limits) {
            setAmountLimits(limits);
        } else {
            await saveQuotes(quotes, alternativeQuotes);
            goto('wallet-coinmarket-buy-offers', {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            });
        }
    };

    return (
        <FormProvider {...methods}>
            <CoinmarketLayout>
                <Wrapper>
                    {isLoading && (
                        <Loading>
                            <Translation id="TR_BUY_LOADING" />
                        </Loading>
                    )}
                    {!isLoading && noProviders && (
                        <NoProviders>
                            <Translation id="TR_BUY_NO_PROVIDERS" />
                        </NoProviders>
                    )}
                    {!isLoading && !noProviders && (
                        <Content>
                            <form onSubmit={methods.handleSubmit(onSubmit)}>
                                <Inputs
                                    amountLimits={amountLimits}
                                    setAmountLimits={setAmountLimits}
                                    buyInfo={buyInfo}
                                />
                                <Footer buyInfo={buyInfo} setAmountLimits={setAmountLimits} />
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

export default CoinmarketBuy;
