import { Select, CoinLogo } from '@trezor/components';
import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import { NetworkSymbol, getEthereumTypeNetworkSymbols } from '@suite-common/wallet-config';
import invityAPI from 'src/services/suite/invityAPI';
import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';
import { CRYPTO_INPUT, FIAT_INPUT, CRYPTO_TOKEN } from 'src/types/wallet/coinmarketExchangeForm';
import {
    getSendCryptoOptions,
    invityApiSymbolToSymbol,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { hasNetworkTypeTradableTokens } from 'src/utils/wallet/coinmarket/commonUtils';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectCoinDefinitions, updateFiatRatesThunk } from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';

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
    const { control, setAmountLimits, account, setValue, getValues, exchangeInfo, composeRequest } =
        useCoinmarketExchangeFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));
    const dispatch = useDispatch();

    const { symbol, tokens } = account;
    const sendCryptoOptions = getSendCryptoOptions(
        account,
        exchangeInfo?.sellSymbols || new Set(),
        coinDefinitions,
    );

    const { outputs } = getValues();
    const currency = outputs?.[0]?.currency;
    const ethereumTypeNetworkSymbols = getEthereumTypeNetworkSymbols();

    return (
        <Controller
            control={control}
            name="sendCryptoSelect"
            defaultValue={sendCryptoOptions[0]}
            render={({ field: { onChange, value } }) => (
                <Select
                    onChange={async (selected: any) => {
                        setValue('setMaxOutputId', undefined);
                        onChange(selected);
                        setAmountLimits(undefined);
                        setValue(CRYPTO_INPUT, '');
                        setValue(FIAT_INPUT, '');
                        const token = selected.value;
                        const invitySymbol = invityApiSymbolToSymbol(token).toLowerCase();
                        const tokenData = tokens?.find(
                            t =>
                                t.symbol === invitySymbol &&
                                t.contract === selected.token?.contract,
                        );
                        if (ethereumTypeNetworkSymbols.includes(token)) {
                            setValue(CRYPTO_TOKEN, null);
                            setValue('outputs.0.address', account.descriptor);
                        } else if (symbol === 'sol') {
                            setValue(CRYPTO_TOKEN, tokenData?.contract ?? null);
                            setValue('outputs.0.address', account.descriptor);
                        } else {
                            // set the address of the token to the output
                            setValue(CRYPTO_TOKEN, tokenData?.contract ?? null);
                            // set token address for ERC20 transaction to estimate the fees more precisely
                            setValue('outputs.0.address', tokenData?.contract ?? '');
                        }
                        await dispatch(
                            updateFiatRatesThunk({
                                ticker: {
                                    symbol: symbol as NetworkSymbol,
                                    tokenAddress: tokenData?.contract as TokenAddress,
                                },
                                localCurrency: currency?.value as FiatCurrencyCode,
                                rateType: 'current',
                                fetchAttemptTimestamp: Date.now() as Timestamp,
                            }),
                        );
                        composeRequest();
                    }}
                    formatOptionLabel={(option: any) => (
                        <Option>
                            {account.symbol === option.value.toLowerCase() ? (
                                <CoinLogo size={18} symbol={account.symbol} />
                            ) : (
                                <TokenLogo src={invityAPI.getCoinLogoUrl(option.value)} />
                            )}
                            <Label>{shouldSendInSats ? 'sat' : option.label}</Label>
                        </Option>
                    )}
                    value={value}
                    isClearable={false}
                    options={sendCryptoOptions}
                    isDisabled={!hasNetworkTypeTradableTokens(account.networkType)}
                    minValueWidth="58px"
                    isClean
                    data-test="@coinmarket/exchange/crypto-currency-select"
                />
            )}
        />
    );
};

export default SendCryptoSelect;
