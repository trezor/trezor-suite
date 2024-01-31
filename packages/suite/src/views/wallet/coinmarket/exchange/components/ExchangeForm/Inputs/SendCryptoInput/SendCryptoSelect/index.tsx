import { Select, CoinLogo } from '@trezor/components';
import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import { getEthereumTypeNetworkSymbols } from '@suite-common/wallet-config';
import invityAPI from 'src/services/suite/invityAPI';
import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';
import { CRYPTO_INPUT, FIAT_INPUT, CRYPTO_TOKEN } from 'src/types/wallet/coinmarketExchangeForm';
import {
    getSendCryptoOptions,
    invityApiSymbolToSymbol,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

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
    const {
        control,
        setAmountLimits,
        account,
        setValue,
        exchangeInfo,
        composeRequest,
        tokensFiatValue,
    } = useCoinmarketExchangeFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const { tokens } = account;
    const sendCryptoOptions = getSendCryptoOptions(
        account,
        exchangeInfo?.sellSymbols || new Set(),
        tokensFiatValue,
    );

    const ethereumTypeNetworkSymbols = getEthereumTypeNetworkSymbols();

    return (
        <Controller
            control={control}
            name="sendCryptoSelect"
            defaultValue={sendCryptoOptions[0]}
            render={({ field: { onChange, value } }) => (
                <Select
                    onChange={(selected: any) => {
                        setValue('setMaxOutputId', undefined);
                        onChange(selected);
                        setAmountLimits(undefined);
                        setValue(CRYPTO_INPUT, '');
                        setValue(FIAT_INPUT, '');
                        const token = selected.value;
                        if (ethereumTypeNetworkSymbols.includes(token)) {
                            setValue(CRYPTO_TOKEN, null);
                            // set own account for non ERC20 transaction
                            setValue('outputs.0.address', account.descriptor);
                        } else {
                            // set the address of the token to the output
                            const symbol = invityApiSymbolToSymbol(token).toLowerCase();
                            const tokenData = tokens?.find(t => t.symbol === symbol);
                            setValue(CRYPTO_TOKEN, tokenData?.contract ?? null);
                            // set token address for ERC20 transaction to estimate the fees more precisely
                            setValue('outputs.0.address', tokenData?.contract ?? '');
                        }
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
                    isDisabled={account.networkType !== 'ethereum'}
                    minValueWidth="100px"
                    isClean
                    data-test="@coinmarket/exchange/crypto-currency-select"
                />
            )}
        />
    );
};

export default SendCryptoSelect;
