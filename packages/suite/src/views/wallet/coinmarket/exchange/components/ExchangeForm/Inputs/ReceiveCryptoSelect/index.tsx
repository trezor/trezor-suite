import { variables, Select } from '@trezor/components';
import { ExchangeInfo } from '@wallet-actions/coinmarketExchangeActions';
import React from 'react';
import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import { ExchangeCoinInfo } from 'invity-api';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { Translation } from '@suite-components';
import { Account } from '@wallet-types';
import invityAPI from '@suite-services/invityAPI';
import { symbolToInvityApiSymbol } from '@suite/utils/wallet/coinmarket/coinmarketUtils';
import { getInputState } from '@suite/utils/wallet/sendFormUtils';

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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    max-width: 150px;
`;

const OptionLabel = styled.div`
    min-width: 60px;
`;

const buildOptions = (
    account: Account,
    exchangeCoinInfo?: ExchangeCoinInfo[],
    exchangeInfo?: ExchangeInfo,
    token?: string,
) => {
    if (!exchangeInfo || !exchangeCoinInfo) return null;

    interface OptionsGroup {
        label: string;
        options: { label: string; value: string; name: string }[];
    }

    const symbolToFilter = symbolToInvityApiSymbol(token || account.symbol);

    return exchangeCoinInfo
        .filter(
            coin =>
                coin.ticker &&
                coin.name &&
                coin.category &&
                coin.ticker.toLowerCase() !== symbolToFilter &&
                exchangeInfo.buySymbols.has(coin.ticker.toLowerCase()),
        )
        .reduce((options, coin) => {
            let category = options.find(option => option.label === coin.category);
            if (!category) {
                category = { label: coin.category, options: [] };
                options.push(category);
            }
            category.options.push({
                label: coin.ticker.toUpperCase(),
                value: coin.ticker.toUpperCase(),
                name: coin.name,
            });
            return options;
        }, [] as OptionsGroup[]);
};

const ReceiveCryptoSelect = () => {
    const { control, setAmountLimits, exchangeInfo, exchangeCoinInfo, account, getValues, errors } =
        useCoinmarketExchangeFormContext();

    const customSearch = (
        option: { data: { label: string; value: string; name: string } },
        searchText: string,
    ) => {
        if (
            option.data.label.toLowerCase().includes(searchText.toLowerCase()) ||
            option.data.name.toLowerCase().includes(searchText.toLowerCase())
        ) {
            return true;
        }
        return false;
    };

    const { outputs, receiveCryptoSelect } = getValues();
    const token = outputs?.[0]?.token;
    const tokenData = account.tokens?.find(t => t.address === token);
    return (
        <Wrapper>
            <Controller
                control={control}
                name="receiveCryptoSelect"
                render={({ onChange, value }) => (
                    <Select
                        inputState={getInputState(
                            errors.receiveCryptoSelect,
                            receiveCryptoSelect?.value,
                        )}
                        onChange={(selected: any) => {
                            onChange(selected);
                            setAmountLimits(undefined);
                        }}
                        value={value}
                        isClearable={false}
                        filterOption={customSearch}
                        options={buildOptions(
                            account,
                            exchangeCoinInfo,
                            exchangeInfo,
                            tokenData?.symbol,
                        )}
                        minWidth="70px"
                        formatOptionLabel={(option: any) => (
                            <Option>
                                <CoinLogo
                                    src={`${
                                        invityAPI.server
                                    }/images/coins/suite/${option.value.toUpperCase()}.svg`}
                                />
                                <OptionLabel>{option.label}</OptionLabel>
                                <OptionName>{option.name}</OptionName>
                            </Option>
                        )}
                        placeholder={<Translation id="TR_TRADE_SELECT_COIN" />}
                        isSearchable
                    />
                )}
            />
        </Wrapper>
    );
};

export default ReceiveCryptoSelect;
