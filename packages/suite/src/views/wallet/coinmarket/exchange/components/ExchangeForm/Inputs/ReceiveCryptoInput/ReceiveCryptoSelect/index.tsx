import { Select, CoinLogo } from '@trezor/components';
import React from 'react';
import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { getSendCryptoOptions, formatLabel } from '@wallet-utils/coinmarket/exchangeUtils';

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const Label = styled.div`
    padding-left: 10px;
`;

const ReceiveCryptoSelect = () => {
    const {
        control,
        setAmountLimits,
        account,
        setMax,
        setValue,
        exchangeInfo,
        setToken,
        compose,
    } = useCoinmarketExchangeFormContext();
    const receiveCryptoSelect = 'receiveCryptoSelect';
    const uppercaseSymbol = account.symbol.toUpperCase();

    return (
        <Controller
            control={control}
            name={receiveCryptoSelect}
            defaultValue={{
                value: uppercaseSymbol,
                label: formatLabel(uppercaseSymbol),
            }}
            render={({ onChange, value }) => {
                return (
                    <Select
                        onChange={async (selected: any) => {
                            setMax(false);
                            onChange(selected);
                            setAmountLimits(undefined);
                            setValue('receiveCryptoInput', '');
                            setValue('fiatInput', '');
                            const lowerCaseToken = selected.value.toLowerCase();
                            if (
                                lowerCaseToken === 'eth' ||
                                lowerCaseToken === 'trop' ||
                                lowerCaseToken === 'etc'
                            ) {
                                setToken(undefined);
                                await compose({ token: undefined });
                            } else {
                                setToken(lowerCaseToken);
                                await compose({ token: lowerCaseToken });
                            }
                        }}
                        formatOptionLabel={(option: any) => {
                            return (
                                <Option>
                                    <CoinLogo size={18} symbol={account.symbol} />
                                    <Label>{formatLabel(option.label)}</Label>
                                </Option>
                            );
                        }}
                        value={value}
                        isClearable={false}
                        options={getSendCryptoOptions(account, exchangeInfo)}
                        isDropdownVisible={account.networkType === 'ethereum'}
                        isDisabled={account.networkType !== 'ethereum'}
                        minWidth="100px"
                        isClean
                        hideTextCursor
                    />
                );
            }}
        />
    );
};

export default ReceiveCryptoSelect;
