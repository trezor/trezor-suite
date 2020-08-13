import * as routerActions from '@suite-actions/routerActions';
import { useActions, useSelector } from '@suite-hooks';
import invityAPI from '@suite/services/invityAPI';
import { Button, CleanSelect, colors } from '@trezor/components';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import regional from '@wallet-constants/coinmarket/regional';
import { AmountLimits, getAmountLimits, processQuotes } from '@wallet-utils/coinmarket/buyUtils';
import { BuyTradeQuoteRequest } from 'invity-api';
import React from 'react';
import { BuyInfo } from '@wallet-actions/coinmarketBuyActions';
import { Controller, useFormContext } from 'react-hook-form';
import styled from 'styled-components';

const Wrapper = styled.div`
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

interface Props {
    buyInfo: BuyInfo;
    setAmountLimits: (amountLimits: AmountLimits | undefined) => void;
}

const Footer = ({ buyInfo, setAmountLimits }: Props) => {
    const { getValues, control } = useFormContext();
    const countrySelect = 'countrySelect';
    const { saveQuoteRequest, saveQuotes } = useActions({
        saveQuoteRequest: coinmarketBuyActions.saveQuoteRequest,
        saveQuotes: coinmarketBuyActions.saveQuotes,
    });

    const { goto } = useActions({ goto: routerActions.goto });
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    const { account } = selectedAccount;
    const country = buyInfo.buyInfo?.country || regional.unknownCountry;
    const defaultCountry = {
        label: regional.countriesMap.get(country),
        value: country,
    };

    return (
        <Wrapper>
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
                                isHovered
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
                        const [quotes, alternativeQuotes] = processQuotes(allQuotes);
                        if (!quotes || quotes.length === 0) {
                            // todo handle no quotes
                        } else {
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
                        }
                    }}
                >
                    Show offers
                </StyledButton>
            </Right>
        </Wrapper>
    );
};

export default Footer;
