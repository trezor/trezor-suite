import { Select, CoinLogo } from '@trezor/components';
import React from 'react';
import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { getSendCryptoOptions, formatLabel } from '@wallet-utils/coinmarket/exchangeUtils';
import { CRYPTO_INPUT, FIAT_INPUT, CRYPTO_TOKEN } from '@wallet-types/coinmarketExchangeForm';
import { invityApiSymbolToSymbol } from '@suite/utils/wallet/coinmarket/coinmarketUtils';

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const Label = styled.div`
    padding-left: 10px;
`;

const SendCryptoSelect = () => {
    const {
        control,
        setAmountLimits,
        account,
        setValue,
        exchangeInfo,
        composeRequest,
    } = useCoinmarketExchangeFormContext();

    const { symbol, tokens } = account;
    const uppercaseSymbol = symbol.toUpperCase();

    return (
        <Controller
            control={control}
            name="sendCryptoSelect"
            defaultValue={{
                value: uppercaseSymbol,
                label: formatLabel(uppercaseSymbol),
            }}
            render={({ onChange, value }) => (
                <Select
                    onChange={(selected: any) => {
                        setValue('setMaxOutputId', undefined);
                        onChange(selected);
                        setAmountLimits(undefined);
                        setValue(CRYPTO_INPUT, '');
                        setValue(FIAT_INPUT, '');
                        const token = selected.value;
                        if (token === 'ETH' || token === 'TROP' || token === 'ETC') {
                            setValue(CRYPTO_TOKEN, undefined);
                            // set own account for non ERC20 transaction
                            setValue('outputs[0].address', account.descriptor);
                        } else {
                            // set the address of the token to the output
                            const symbol = invityApiSymbolToSymbol(token).toLowerCase();
                            const tokenData = tokens?.find(t => t.symbol === symbol);
                            setValue(CRYPTO_TOKEN, tokenData?.address);
                            // set token address for ERC20 transaction to estimate the fees more precisely
                            setValue('outputs[0].address', tokenData?.address);
                        }
                        composeRequest();
                    }}
                    formatOptionLabel={(option: any) => (
                        <Option>
                            <CoinLogo size={18} symbol={account.symbol} />
                            <Label>{formatLabel(option.label)}</Label>
                        </Option>
                    )}
                    value={value}
                    isClearable={false}
                    options={getSendCryptoOptions(account, exchangeInfo)}
                    isDropdownVisible={account.networkType === 'ethereum'}
                    isDisabled={account.networkType !== 'ethereum'}
                    minWidth="100px"
                    isClean
                    hideTextCursor
                />
            )}
        />
    );
};

export default SendCryptoSelect;
