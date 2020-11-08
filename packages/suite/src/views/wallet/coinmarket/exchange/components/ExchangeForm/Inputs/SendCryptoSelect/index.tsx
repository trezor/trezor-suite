import { variables, Select, colors } from '@trezor/components';
import { ExchangeInfo } from '@wallet-actions/coinmarketExchangeActions';
import React from 'react';
import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import { ExchangeCoinInfo } from 'invity-api';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { Translation } from '@suite-components';
import { Account } from '@wallet-types';
import invityAPI from '@suite-services/invityAPI';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    min-width: 230px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const CoinLogo = styled.img`
    display: flex;
    align-items: center;
    padding-right: 6px;
    height: 16px;
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const OptionName = styled.div`
    display: flex;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const OptionLabel = styled.div`
    min-width: 70px;
`;

const buildOptions = (
    account: Account,
    exchangeCoinInfo?: ExchangeCoinInfo[],
    exchangeInfo?: ExchangeInfo,
) => {
    if (!exchangeInfo || !exchangeCoinInfo) return null;

    interface Options {
        label: React.ReactElement;
        options: { label: string; value: string; name: string }[];
    }

    const popular: Options = {
        label: <Translation id="TR_EXCHANGE_POPULAR_COINS" />,
        options: [],
    };

    const stable: Options = {
        label: <Translation id="TR_EXCHANGE_STABLE_COINS" />,
        options: [],
    };

    const all: Options = {
        label: <Translation id="TR_EXCHANGE_OTHER_COINS" />,
        options: [],
    };

    const filteredExchangeCoins = exchangeCoinInfo.filter(
        coin => coin.ticker.toLowerCase() !== account.symbol,
    );

    filteredExchangeCoins.forEach(info => {
        if (!exchangeInfo.buySymbols.has(info.ticker.toLowerCase())) return false;

        if (info.category === 'Popular currencies') {
            popular.options.push({
                label: info.ticker.toUpperCase(),
                value: info.ticker.toUpperCase(),
                name: info.name,
            });
        }

        if (info.category === 'Stablecoins') {
            stable.options.push({
                label: `${info.ticker.toUpperCase()}`,
                value: info.ticker.toUpperCase(),
                name: info.name,
            });
        }

        if (info.category === 'All currencies') {
            all.options.push({
                label: `${info.ticker.toUpperCase()}`,
                value: info.ticker.toUpperCase(),
                name: info.name,
            });
        }
    });

    return [popular, stable, all];
};

const SendCryptoSelect = () => {
    const {
        control,
        setAmountLimits,
        exchangeInfo,
        exchangeCoinInfo,
        account,
    } = useCoinmarketExchangeFormContext();

    return (
        <Wrapper>
            <Controller
                control={control}
                defaultValue={false}
                name="sendCryptoSelect"
                render={({ onChange, value }) => {
                    return (
                        <Select
                            onChange={(selected: any) => {
                                onChange(selected);
                                setAmountLimits(undefined);
                            }}
                            value={value}
                            isClearable={false}
                            options={buildOptions(account, exchangeCoinInfo, exchangeInfo)}
                            minWidth="70px"
                            noTopLabel
                            formatOptionLabel={(option: any) => {
                                return (
                                    <Option>
                                        <CoinLogo
                                            src={`${
                                                invityAPI.server
                                            }/images/coins/suite/${option.value.toUpperCase()}.svg`}
                                        />
                                        <OptionLabel>{option.label}</OptionLabel>
                                        <OptionName>{option.name}</OptionName>
                                    </Option>
                                );
                            }}
                            placeholder={<Translation id="TR_COINMARKET_SELECT_COIN" />}
                        />
                    );
                }}
            />
        </Wrapper>
    );
};

export default SendCryptoSelect;
