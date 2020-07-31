import React from 'react';
import styled from 'styled-components';
import validator from 'validator';
import BigNumber from 'bignumber.js';
import { useForm, Controller } from 'react-hook-form';

import { FIAT } from '@suite-config';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import { CoinmarketLayout, ProvidedByInvity } from '@wallet-components';
import { useBuyInfo } from '@wallet-hooks/useCoinmarket';
import regional from '@wallet-constants/coinmarket/regional';
import * as coinmarketActions from '@wallet-actions/coinmarketActions';
import * as routerActions from '@suite-actions/routerActions';
import { useActions, useSelector } from '@suite-hooks';
import { Button, Select, Input, colors, H2, SelectInput, CoinLogo } from '@trezor/components';
import { Translation } from '@suite-components';
import { BuyTradeQuoteRequest } from '@suite/services/invityAPI/buyTypes';
import invityAPI from '@suite/services/invityAPI/service';

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
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
    align-items: center;
    padding-left: 10px;
    padding-top: 10px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    padding-right: 10px;
    white-space: nowrap;
`;

const StyledButton = styled(Button)`
    min-width: 200px;
`;

const Controls = styled.div`
    display: flex;
    margin: 25px 0;
    padding: 0 0 20px 0;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const Control = styled.div`
    cursor: pointer;
    padding: 0 10px 0 0;
`;

const BottomContent = styled.div``;

const InvityFooter = styled.div`
    display: flex;
    margin: 20px 0;
    padding: 0 0 20px 0;
    justify-content: flex-end;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const PreviousTransactions = styled.div``;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 5px;
`;

const addValue = (currentValue = '0', addValue: string) => {
    const result = new BigNumber(currentValue.length > 1 ? currentValue : '0')
        .plus(addValue)
        .toFixed();

    return result;
};

const buildOption = (currency: string) => {
    return { value: currency, label: currency.toUpperCase() };
};

const CoinmarketBuy = () => {
    const { register, getValues, setValue, errors, control } = useForm({ mode: 'onChange' });
    const fiatInput = 'fiatInput';
    const currencySelect = 'currencySelect';
    const countrySelect = 'countrySelect';
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { account } = selectedAccount;

    const { buyInfo } = useBuyInfo();
    const { saveBuyQuoteRequest, saveBuyQuotes, saveBuyInfo } = useActions({
        saveBuyQuoteRequest: coinmarketActions.saveBuyQuoteRequest,
        saveBuyQuotes: coinmarketActions.saveBuyQuotes,
        saveBuyInfo: coinmarketActions.saveBuyInfo,
    });

    // TODO - do we really need to store it here? probably better would be in useBuyInfo, where it could skip the load if already set
    saveBuyInfo(buyInfo);

    const { goto } = useActions({
        goto: routerActions.goto,
    });

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
    console.log('buyInfo', buyInfo);
    console.log('errors.fiatInputName', errors[fiatInput]);
    console.log('buyInfo.buyInfo?.suggestedFiatCurrency', buyInfo.buyInfo?.suggestedFiatCurrency);

    // TODO - handle situation that account is not set
    if (!account) {
        return null;
    }

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
            <Content>
                <Top>
                    <Left>
                        <Input
                            noTopLabel
                            innerRef={register({
                                validate: value => {
                                    if (!value) {
                                        return 'TR_ERROR_EMPTY';
                                    }

                                    if (!validator.isNumeric(value)) {
                                        return 'TR_ERROR_NOT_NUMBER';
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
                                            <SelectInput
                                                options={FIAT.currencies.map((currency: string) =>
                                                    buildOption(currency),
                                                )}
                                                isSearchable
                                                value={value}
                                                isClearable={false}
                                                minWidth="45px"
                                                onChange={(selected: any) => {
                                                    onChange(selected);
                                                }}
                                            />
                                        );
                                    }}
                                />
                            }
                        />
                    </Left>
                    <Right>
                        {account && <StyledCoinLogo size={25} symbol={account.symbol} />}
                        {account && <Translation {...getTitleForNetwork(account.symbol)} />}
                    </Right>
                </Top>
                <Controls>
                    <Control
                        onClick={() => {
                            setValue(fiatInput, addValue(getValues(fiatInput), '100'), {
                                shouldValidate: true,
                            });
                        }}
                    >
                        +100
                    </Control>
                    <Control
                        onClick={() => {
                            setValue(fiatInput, addValue(getValues(fiatInput), '1000'), {
                                shouldValidate: true,
                            });
                        }}
                    >
                        +1000
                    </Control>
                </Controls>
                <Footer>
                    <Left>
                        <Label>Offers for:</Label>
                        <Controller
                            control={control}
                            defaultValue={defaultCountry}
                            name={countrySelect}
                            render={({ onChange, value }) => {
                                return (
                                    <Select
                                        options={regional.countriesOptions}
                                        isSearchable
                                        value={value}
                                        isClearable={false}
                                        minWidth="45px"
                                        onChange={(selected: any) => {
                                            onChange(selected);
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
                                await saveBuyQuoteRequest(request);
                                const quotes = await invityAPI.getBuyQuotes(request);
                                await saveBuyQuotes(quotes);

                                // todo handle no quotes and min/max situation - copy code from invity.io

                                // if success redirect to offers views
                                goto('wallet-coinmarket-buy-offers');
                            }}
                        >
                            Show offers
                        </StyledButton>
                    </Right>
                </Footer>
            </Content>
        </CoinmarketLayout>
    );
};

export default CoinmarketBuy;
