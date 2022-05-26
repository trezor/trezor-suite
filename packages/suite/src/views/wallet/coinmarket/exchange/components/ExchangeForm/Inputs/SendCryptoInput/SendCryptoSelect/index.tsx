import { Select, CoinLogo } from '@trezor/components';
import React from 'react';
import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import invityAPI from '@suite-services/invityAPI';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { CRYPTO_INPUT, FIAT_INPUT, CRYPTO_TOKEN } from '@wallet-types/coinmarketExchangeForm';
import {
    getSendCryptoOptions,
    invityApiSymbolToSymbol,
} from '@suite/utils/wallet/coinmarket/coinmarketUtils';

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const Label = styled.div`
    padding-left: 10px;
`;

const TokenLogo = styled.img`
    display: flex;
    align-items: center;
    height: 18px;
`;

const SendCryptoSelect = () => {
    const { control, setAmountLimits, account, setValue, exchangeInfo, composeRequest } =
        useCoinmarketExchangeFormContext();

    const { tokens } = account;
    const sendCryptoOptions = getSendCryptoOptions(account, exchangeInfo?.sellSymbols || new Set());

    return (
        <Controller
            control={control}
            name="sendCryptoSelect"
            defaultValue={sendCryptoOptions[0]}
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
                            {account.symbol === option.value.toLowerCase() ? (
                                <CoinLogo size={18} symbol={account.symbol} />
                            ) : (
                                <TokenLogo
                                    src={`${invityAPI.getApiServerUrl()}/images/coins/suite/${
                                        option.value
                                    }.svg`}
                                />
                            )}
                            <Label>{option.label}</Label>
                        </Option>
                    )}
                    value={value}
                    isClearable={false}
                    options={sendCryptoOptions}
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
