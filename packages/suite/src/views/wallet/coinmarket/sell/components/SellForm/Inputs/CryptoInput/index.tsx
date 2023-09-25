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
import { useTranslation } from 'src/hooks/suite';
import { useFormatters } from '@suite-common/formatters';
import {
    validateDecimals,
    validateInteger,
    validateLimits,
    validateMin,
} from 'src/utils/suite/validation';

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
        getValues,
        sellInfo,
        setValue,
        setAmountLimits,
        composeRequest,
        tokensFiatValue,
    } = useCoinmarketSellFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const { CryptoAmountFormatter } = useFormatters();

    const { translationString } = useTranslation();

    const uppercaseSymbol = account.symbol.toUpperCase();
    const cryptoOption = {
        value: uppercaseSymbol,
        label: uppercaseSymbol,
    };

    const { tokens } = account;
    const cryptoInputValue = getValues(CRYPTO_INPUT);

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
            inputState={getInputState(errors.cryptoInput, cryptoInputValue)}
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
                                if (ethereumTypeNetworkSymbols.includes(token)) {
                                    setValue(CRYPTO_TOKEN, null);
                                    // set own account for non ERC20 transaction
                                    setValue('outputs.0.address', account.descriptor);
                                } else {
                                    // set the address of the token to the output
                                    const symbol = invityApiSymbolToSymbol(token).toLowerCase();
                                    const tokenData = tokens?.find(
                                        t =>
                                            t.symbol === symbol &&
                                            t.contract === selected.token?.contract,
                                    );
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
                                tokensFiatValue,
                            )}
                            isClean
                            hideTextCursor
                            isDisabled={account.networkType !== 'ethereum'}
                            minWidth="100px"
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
