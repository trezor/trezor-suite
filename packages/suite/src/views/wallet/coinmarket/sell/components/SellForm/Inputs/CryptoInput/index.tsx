import styled from 'styled-components';
import invityAPI from 'src/services/suite/invityAPI';
import { NumberInput } from 'src/components/suite';
import { Select, CoinLogo } from '@trezor/components';
import { Controller } from 'react-hook-form';
import { useCoinmarketSellFormContext } from 'src/hooks/wallet/useCoinmarketSellForm';
import { getEthereumTypeNetworkSymbols } from '@suite-common/wallet-config';
import { getInputState } from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import {
    CRYPTO_CURRENCY_SELECT,
    CRYPTO_INPUT,
    CRYPTO_TOKEN,
    FIAT_INPUT,
} from 'src/types/wallet/coinmarketSellForm';
import {
    getSendCryptoOptions,
    invityApiSymbolToSymbol,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { useFormatters } from '@suite-common/formatters';
import {
    validateDecimals,
    validateInteger,
    validateLimits,
    validateMin,
} from 'src/utils/suite/validation';
import { networkToCryptoSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { selectCoinDefinitions } from '@suite-common/wallet-core';
import { hasNetworkTypeTradableTokens } from 'src/utils/wallet/coinmarket/commonUtils';

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

const CryptoInput = () => {
    const {
        formState: { errors },
        account,
        network,
        control,
        amountLimits,
        onCryptoAmountChange,
        sellInfo,
        setValue,
        setAmountLimits,
        composeRequest,
    } = useCoinmarketSellFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));

    const { CryptoAmountFormatter } = useFormatters();

    const { translationString } = useTranslation();

    const cryptoSymbol = networkToCryptoSymbol(account.symbol)!;
    const cryptoOption = {
        value: cryptoSymbol,
        label: cryptoSymbol,
        cryptoSymbol,
    };

    const { symbol, tokens } = account;

    const cryptoInputRules = {
        validate: {
            min: validateMin(translationString),
            integer: validateInteger(translationString, { except: !shouldSendInSats }),
            decimals: validateDecimals(translationString, { decimals: network.decimals }),
            limits: validateLimits(translationString, {
                amountLimits,
                areSatsUsed: !!shouldSendInSats,
                formatter: CryptoAmountFormatter,
            }),
        },
    };

    const ethereumTypeNetworkSymbols = getEthereumTypeNetworkSymbols();

    return (
        <NumberInput
            control={control}
            onChange={onCryptoAmountChange}
            defaultValue=""
            inputState={getInputState(errors.cryptoInput)}
            name={CRYPTO_INPUT}
            maxLength={formInputsMaxLength.amount}
            rules={cryptoInputRules}
            bottomText={errors[CRYPTO_INPUT]?.message || null}
            innerAddon={
                <Controller
                    control={control}
                    name={CRYPTO_CURRENCY_SELECT}
                    defaultValue={cryptoOption}
                    render={({ field: { onChange, value } }) => (
                        <Select
                            onChange={(selected: any) => {
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
                                composeRequest();
                            }}
                            value={value}
                            isClearable={false}
                            options={getSendCryptoOptions(
                                account,
                                sellInfo?.supportedCryptoCurrencies || new Set(),
                                coinDefinitions,
                            )}
                            isClean
                            isDisabled={!hasNetworkTypeTradableTokens(account.networkType)}
                            minValueWidth="100px"
                            formatOptionLabel={(
                                option: ReturnType<typeof getSendCryptoOptions>[number],
                            ) => (
                                <Option>
                                    {account.symbol === option.value.toLowerCase() ? (
                                        <CoinLogo size={18} symbol={account.symbol} />
                                    ) : (
                                        <TokenLogo src={invityAPI.getCoinLogoUrl(option.value)} />
                                    )}
                                    <Label>{shouldSendInSats ? 'sat' : option.label}</Label>
                                </Option>
                            )}
                        />
                    )}
                />
            }
        />
    );
};

export default CryptoInput;
