import { useEffect } from 'react';
import styled from 'styled-components';
import invityAPI from 'src/services/suite/invityAPI';
import { Controller } from 'react-hook-form';
import { fiatCurrencies } from '@suite-common/suite-config';
import { NumberInput } from 'src/components/suite';
import { getCryptoOptions } from 'src/utils/wallet/coinmarket/buyUtils';
import { Select, CoinLogo } from '@trezor/components';
import { buildFiatOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useCoinmarketBuyFormContext } from 'src/hooks/wallet/useCoinmarketBuyForm';
import { getInputState } from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { Wrapper, Left, Middle, Right, StyledIcon } from 'src/views/wallet/coinmarket';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useTranslation } from 'src/hooks/suite';
import { useFormatters } from '@suite-common/formatters';
import {
    validateDecimals,
    validateInteger,
    validateLimits,
    validateMin,
} from 'src/utils/suite/validation';
import { networkToCryptoSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
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

const Inputs = () => {
    const { translationString } = useTranslation();
    const {
        formState: { errors },
        trigger,
        account,
        network,
        control,
        setValue,
        clearErrors,
        amountLimits,
        buyInfo,
        setAmountLimits,
        defaultCurrency,
    } = useCoinmarketBuyFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const { CryptoAmountFormatter } = useFormatters();

    const cryptoSymbol = networkToCryptoSymbol(account.symbol)!;
    const fiatInput = 'fiatInput';
    const cryptoInput = 'cryptoInput';
    const currencySelect = 'currencySelect';
    const cryptoSelect = 'cryptoSelect';

    // Trigger validation once amountLimits are loaded after first submit
    useEffect(() => {
        if (amountLimits) {
            trigger([cryptoInput, fiatInput]);
        }
    }, [amountLimits, trigger]);

    const fiatInputRules = {
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: 2 }),
            minFiat: (value: string) => {
                if (value && amountLimits?.minFiat && Number(value) < amountLimits.minFiat) {
                    return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT', {
                        minimum: amountLimits.minFiat,
                        currency: amountLimits.currency,
                    });
                }
            },
            maxFiat: (value: string) => {
                if (value && amountLimits?.maxFiat && Number(value) > amountLimits.maxFiat) {
                    return translationString('TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT', {
                        maximum: amountLimits.maxFiat,
                        currency: amountLimits.currency,
                    });
                }
            },
        },
    };
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

    return (
        <Wrapper responsiveSize="LG">
            <Left>
                <NumberInput
                    control={control}
                    rules={fiatInputRules}
                    onChange={() => {
                        setValue(cryptoInput, '');
                        clearErrors(cryptoInput);
                    }}
                    inputState={getInputState(errors.fiatInput)}
                    name={fiatInput}
                    maxLength={formInputsMaxLength.amount}
                    bottomText={errors[fiatInput]?.message || null}
                    innerAddon={
                        <Controller
                            control={control}
                            name={currencySelect}
                            defaultValue={defaultCurrency}
                            render={({ field: { onChange, value } }) => (
                                <Select
                                    options={Object.keys(fiatCurrencies)
                                        .filter(c => buyInfo?.supportedFiatCurrencies.has(c))
                                        .map((currency: string) => buildFiatOption(currency))}
                                    isSearchable
                                    data-test="@coinmarket/buy/fiat-currency-select"
                                    value={value}
                                    isClearable={false}
                                    minValueWidth="58px"
                                    isClean
                                    onChange={(selected: any) => {
                                        onChange(selected);
                                        setAmountLimits(undefined);
                                    }}
                                />
                            )}
                        />
                    }
                    data-test="@coinmarket/buy/fiat-input"
                />
            </Left>
            <Middle responsiveSize="LG">
                <StyledIcon responsiveSize="LG" icon="TRANSFER" size={16} />
            </Middle>
            <Right>
                <NumberInput
                    control={control}
                    onChange={() => {
                        setValue(fiatInput, '');
                        clearErrors(fiatInput);
                    }}
                    inputState={getInputState(errors.cryptoInput)}
                    name={cryptoInput}
                    maxLength={formInputsMaxLength.amount}
                    rules={cryptoInputRules}
                    bottomText={errors[cryptoInput]?.message || null}
                    innerAddon={
                        <Controller
                            control={control}
                            name={cryptoSelect}
                            defaultValue={{
                                value: cryptoSymbol,
                                label: cryptoSymbol,
                                cryptoSymbol,
                            }}
                            render={({ field: { onChange, value } }) => (
                                <Select
                                    onChange={(selected: any) => {
                                        onChange(selected);
                                    }}
                                    value={value}
                                    isSearchable
                                    isClearable={false}
                                    data-test="@coinmarket/buy/crypto-currency-select"
                                    options={getCryptoOptions(
                                        account.symbol,
                                        buyInfo?.supportedCryptoCurrencies || new Set(),
                                    )}
                                    formatOptionLabel={(
                                        option: ReturnType<typeof getCryptoOptions>[number],
                                    ) => (
                                        <Option>
                                            {account.symbol.toUpperCase() === option.value ? (
                                                <CoinLogo size={18} symbol={account.symbol} />
                                            ) : (
                                                <TokenLogo
                                                    src={invityAPI.getCoinLogoUrl(option.value)}
                                                />
                                            )}
                                            <Label>{shouldSendInSats ? 'sat' : option.label}</Label>
                                        </Option>
                                    )}
                                    isClean
                                    isDisabled={!hasNetworkTypeTradableTokens(account.networkType)}
                                    minValueWidth="100px"
                                />
                            )}
                        />
                    }
                    data-test="@coinmarket/buy/crypto-input"
                />
            </Right>
        </Wrapper>
    );
};

export default Inputs;
