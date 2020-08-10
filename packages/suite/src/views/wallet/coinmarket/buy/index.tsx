import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import validator from 'validator';
import { useForm, Controller } from 'react-hook-form';

import { FIAT } from '@suite-config';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import { CoinmarketLayout, ProvidedByInvity, WalletLayout } from '@wallet-components';
import { useBuyInfo } from '@wallet-hooks/useCoinmarket';
import regional from '@wallet-constants/coinmarket/regional';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import { buildOption } from '@wallet-utils/coinmarket/buyUtils';
import * as routerActions from '@suite-actions/routerActions';
import { useActions, useSelector } from '@suite-hooks';
import {
    Button,
    Input,
    colors,
    H2,
    CleanSelect,
    CoinLogo,
    variables,
    Icon,
} from '@trezor/components';
import { Translation } from '@suite-components';
import { BuyTradeQuoteRequest } from '@suite/services/invityAPI/buyTypes';
import invityAPI from '@suite/services/invityAPI/service';
import {
    AmountLimits,
    getAmountLimits,
    processQuotes,
} from '@suite/utils/wallet/coinmarket/buyUtils';

const Wrapper = styled.div``;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 25px;
    flex: 1;
`;

const Top = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
`;

const Footer = styled.div`
    display: flex;
    align-items: center;
    padding-top: 50px;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    padding-right: 10px;
    white-space: nowrap;
`;

const StyledButton = styled(Button)`
    min-width: 200px;
    margin-left: 20px;
`;

const BottomContent = styled.div``;

const Middle = styled.div`
    display: flex;
    min-width: 65px;
    height: 48px;
    align-items: center;
    justify-content: center;
`;

const InvityFooter = styled.div`
    display: flex;
    margin: 20px 0;
    padding: 0 0 20px 0;
    justify-content: flex-end;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const PreviousTransactions = styled.div``;

const Loading = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

const NoProviders = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 5px;
`;

const CoinmarketBuy = () => {
    const { register, getValues, trigger, errors, control } = useForm({
        mode: 'onChange',
    });
    const fiatInput = 'fiatInput';
    const currencySelect = 'currencySelect';
    const countrySelect = 'countrySelect';

    const { buyInfo } = useBuyInfo();
    const { saveQuoteRequest, saveQuotes, saveBuyInfo } = useActions({
        saveQuoteRequest: coinmarketBuyActions.saveQuoteRequest,
        saveQuotes: coinmarketBuyActions.saveQuotes,
        saveBuyInfo: coinmarketBuyActions.saveBuyInfo,
    });

    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    // TODO - do we really need to store it here? probably better would be in useBuyInfo, where it could skip the load if already set
    saveBuyInfo(buyInfo);

    const { goto } = useActions({
        goto: routerActions.goto,
    });

    useEffect(() => {
        // when the limits change, trigger revalidation
        trigger([fiatInput]);
    }, [amountLimits, trigger]);

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Coinmarket" account={selectedAccount} />;
    }

    const { account } = selectedAccount;

    const defaultCurrencyInfo = buyInfo.buyInfo?.suggestedFiatCurrency;
    const defaultCurrency = defaultCurrencyInfo
        ? buildOption(defaultCurrencyInfo)
        : {
              label: 'USD',
              value: 'usd',
          };

    const country = buyInfo.buyInfo?.country || regional.unknownCountry;
    const defaultCountry = {
        label: regional.countriesMap.get(country),
        value: country,
    };

    console.log('errors', errors);
    console.log('buyInfo', buyInfo, country, defaultCountry);
    console.log('errors.fiatInputName', errors[fiatInput]);
    console.log('buyInfo.buyInfo?.suggestedFiatCurrency', buyInfo.buyInfo?.suggestedFiatCurrency);

    const isLoading = !buyInfo?.buyInfo;
    const noProviders =
        buyInfo.buyInfo?.providers.length === 0 ||
        !buyInfo.supportedCryptoCurrencies.has(account.symbol);

    return (
        <CoinmarketLayout
            bottom={
                <BottomContent>
                    <InvityFooter>
                        <ProvidedByInvity />
                    </InvityFooter>
                    <PreviousTransactions>
                        <H2>Previous Transactions</H2>
                    </PreviousTransactions>
                </BottomContent>
            }
        >
            <Wrapper>
                {isLoading && <Loading>loading</Loading>}
                {!isLoading && noProviders && <NoProviders>No providers</NoProviders>}
                {!isLoading && !noProviders && (
                    <Content>
                        <Top>
                            <Left>
                                <Input
                                    noTopLabel
                                    defaultValue="10000"
                                    innerRef={register({
                                        validate: value => {
                                            if (!value) {
                                                return 'TR_ERROR_EMPTY';
                                            }

                                            if (!validator.isNumeric(value)) {
                                                return 'TR_ERROR_NOT_NUMBER';
                                            }

                                            if (amountLimits) {
                                                const amount = Number(value);
                                                if (
                                                    amountLimits.minFiat &&
                                                    amount < amountLimits.minFiat
                                                ) {
                                                    return `Minimum is ${amountLimits.minFiat} ${amountLimits.currency}`;
                                                }
                                                if (
                                                    amountLimits.maxFiat &&
                                                    amount > amountLimits.maxFiat
                                                ) {
                                                    return `Maximum is ${amountLimits.maxFiat} ${amountLimits.currency}`;
                                                }
                                            }
                                        },
                                    })}
                                    state={errors[fiatInput] ? 'error' : undefined}
                                    name={fiatInput}
                                    bottomText={errors[fiatInput] && errors[fiatInput].message}
                                    innerAddon={
                                        <Controller
                                            control={control}
                                            name={currencySelect}
                                            defaultValue={defaultCurrency}
                                            render={({ onChange, value }) => {
                                                return (
                                                    <CleanSelect
                                                        options={FIAT.currencies
                                                            .filter(c =>
                                                                buyInfo.supportedFiatCurrencies.has(
                                                                    c,
                                                                ),
                                                            )
                                                            .map((currency: string) =>
                                                                buildOption(currency),
                                                            )}
                                                        isSearchable
                                                        value={value}
                                                        isClearable={false}
                                                        minWidth="45px"
                                                        onChange={(selected: any) => {
                                                            onChange(selected);
                                                            setAmountLimits(undefined);
                                                        }}
                                                    />
                                                );
                                            }}
                                        />
                                    }
                                />
                            </Left>
                            <Middle>
                                <Icon icon="TRANSFER" size={16} />
                            </Middle>
                            <Right>
                                <Input
                                    noTopLabel
                                    innerAddon={
                                        <>
                                            <StyledCoinLogo size={18} symbol={account.symbol} />
                                            <Translation {...getTitleForNetwork(account.symbol)} />
                                        </>
                                    }
                                />
                            </Right>
                        </Top>
                        <Footer>
                            <Left>
                                <Label>Offers for:</Label>
                                <Controller
                                    control={control}
                                    defaultValue={defaultCountry}
                                    name={countrySelect}
                                    render={({ onChange, value }) => {
                                        return (
                                            <CleanSelect
                                                noTopLabel
                                                options={regional.countriesOptions}
                                                isSearchable
                                                value={value}
                                                isClearable={false}
                                                minWidth="170px"
                                                onChange={(selected: any) => {
                                                    onChange(selected);
                                                    setAmountLimits(undefined);
                                                }}
                                            />
                                        );
                                    }}
                                />
                            </Left>
                            <Right>
                                <StyledButton
                                    onClick={async () => {
                                        const formValues = getValues();
                                        console.log('formValues', formValues);
                                        const request: BuyTradeQuoteRequest = {
                                            // TODO - handle crypto amount entry
                                            wantCrypto: false,
                                            fiatCurrency: formValues.currencySelect.value.toUpperCase(),
                                            receiveCurrency: account.symbol.toUpperCase(),
                                            country: formValues.countrySelect.value,
                                            fiatStringAmount: formValues.fiatInput,
                                        };
                                        await saveQuoteRequest(request);
                                        const allQuotes = await invityAPI.getBuyQuotes(request);
                                        const [quotes, alternativeQuotes] = processQuotes(
                                            allQuotes,
                                        );
                                        if (!quotes || quotes.length === 0) {
                                            // todo handle no quotes
                                        } else {
                                            const limits = getAmountLimits(request, quotes);
                                            console.log('limits', limits, request);
                                            if (limits) {
                                                setAmountLimits(limits);
                                            } else {
                                                await saveQuotes(quotes, alternativeQuotes);

                                                // if success redirect to offers views
                                                goto('wallet-coinmarket-buy-offers', {
                                                    symbol: account.symbol,
                                                    accountIndex: account.index,
                                                    accountType: account.accountType,
                                                });
                                            }
                                        }
                                    }}
                                >
                                    Show offers
                                </StyledButton>
                            </Right>
                        </Footer>
                    </Content>
                )}
            </Wrapper>
        </CoinmarketLayout>
    );
};

export default CoinmarketBuy;
