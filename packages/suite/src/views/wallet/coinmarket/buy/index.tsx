import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import validator from 'validator';
import { useForm, Controller } from 'react-hook-form';

import { FIAT } from '@suite-config';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import { CoinmarketLayout, ProvidedByInvity, WalletLayout } from '@wallet-components';
import { useBuyInfo } from '@wallet-hooks/useCoinmarket';
import regional from '@wallet-constants/coinmarket/regional';
import * as coinmarketActions from '@wallet-actions/coinmarketActions';
import { buildOption, addValue } from '@wallet-utils/coinmarket/buyUtils';
import * as routerActions from '@suite-actions/routerActions';
import { useActions, useSelector } from '@suite-hooks';
import {
    Button,
    Select,
    Input,
    colors,
    H2,
    SelectInput,
    CoinLogo,
    variables,
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
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
    padding-left: 20px;
    padding-top: 12px;
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
    const { register, getValues, setValue, trigger, errors, control } = useForm({
        mode: 'onChange',
    });
    const fiatInput = 'fiatInput';
    const currencySelect = 'currencySelect';
    const countrySelect = 'countrySelect';

    const { buyInfo } = useBuyInfo();
    const { saveBuyQuoteRequest, saveBuyQuotes, saveBuyInfo } = useActions({
        saveBuyQuoteRequest: coinmarketActions.saveBuyQuoteRequest,
        saveBuyQuotes: coinmarketActions.saveBuyQuotes,
        saveBuyInfo: coinmarketActions.saveBuyInfo,
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
    const noProviders = buyInfo.buyInfo?.providers.length === 0;

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
                                                    <SelectInput
                                                        options={FIAT.currencies.map(
                                                            (currency: string) =>
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
                            <Right>
                                <StyledCoinLogo size={25} symbol={account.symbol} />
                                <Translation {...getTitleForNetwork(account.symbol)} />
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
                            <Label>Offers for:</Label>
                            <Controller
                                control={control}
                                defaultValue={defaultCountry}
                                name={countrySelect}
                                render={({ onChange, value }) => {
                                    return (
                                        <Select
                                            noTopLabel
                                            options={regional.countriesOptions}
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
                                    const allQuotes = await invityAPI.getBuyQuotes(request);
                                    const [quotes, alternativeQuotes] = processQuotes(allQuotes);
                                    if (!quotes || quotes.length === 0) {
                                        // todo handle no quotes
                                    } else {
                                        const limits = getAmountLimits(request, quotes);
                                        console.log('limits', limits, request);
                                        if (limits) {
                                            setAmountLimits(limits);
                                        } else {
                                            await saveBuyQuotes(quotes, alternativeQuotes);

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
                        </Footer>
                    </Content>
                )}
            </Wrapper>
        </CoinmarketLayout>
    );
};

export default CoinmarketBuy;
