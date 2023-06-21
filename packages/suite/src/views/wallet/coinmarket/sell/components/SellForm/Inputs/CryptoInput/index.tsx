import React, { useMemo } from 'react';
import styled from 'styled-components';
import invityAPI from 'src/services/suite/invityAPI';
import { FormattedCryptoAmount, Translation, NumberInput } from 'src/components/suite';
import { Select, CoinLogo } from '@trezor/components';
import Bignumber from 'bignumber.js';
import { Controller } from 'react-hook-form';
import { useCoinmarketSellFormContext } from 'src/hooks/wallet/useCoinmarketSellForm';
import {
    amountToSatoshi,
    isDecimalsValid,
    isInteger,
    getInputState,
} from '@suite-common/wallet-utils';
import { InputError } from 'src/components/wallet';
import { MAX_LENGTH } from 'src/constants/suite/inputs';
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
import { TypedValidationRules } from 'src/types/wallet/form';

interface CryptoInputProps {
    activeInput: typeof FIAT_INPUT | typeof CRYPTO_INPUT;
    setActiveInput: React.Dispatch<React.SetStateAction<typeof FIAT_INPUT | typeof CRYPTO_INPUT>>;
}

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

const CryptoInput = ({ activeInput, setActiveInput }: CryptoInputProps) => {
    const {
        formState: { errors },
        account,
        network,
        control,
        formState,
        amountLimits,
        onCryptoAmountChange,
        getValues,
        sellInfo,
        setValue,
        setAmountLimits,
        composeRequest,
    } = useCoinmarketSellFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const uppercaseSymbol = account.symbol.toUpperCase();
    const cryptoOption = {
        value: uppercaseSymbol,
        label: uppercaseSymbol,
    };

    const { tokens } = account;
    const cryptoInputValue = getValues(CRYPTO_INPUT);

    const cryptoInputRules = useMemo<TypedValidationRules>(
        () => ({
            validate: (value: string) => {
                if (activeInput === CRYPTO_INPUT) {
                    if (!value) {
                        if (formState.isSubmitting) {
                            return <Translation id="TR_REQUIRED_FIELD" />;
                        }
                        return;
                    }

                    const amountBig = new Bignumber(value);

                    if (amountBig.isNaN()) {
                        return <Translation id="AMOUNT_IS_NOT_NUMBER" />;
                    }

                    if (shouldSendInSats && !isInteger(value)) {
                        return 'AMOUNT_IS_NOT_INTEGER';
                    }

                    if (amountBig.lte(0)) {
                        return <Translation id="AMOUNT_IS_TOO_LOW" />;
                    }

                    if (!isDecimalsValid(value, network.decimals)) {
                        return (
                            <Translation
                                id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                                values={{ decimals: network.decimals }}
                            />
                        );
                    }

                    if (amountLimits) {
                        const amount = Number(value);

                        let minCrypto = 0;
                        if (amountLimits.minCrypto) {
                            minCrypto = shouldSendInSats
                                ? Number(
                                      amountToSatoshi(
                                          amountLimits.minCrypto.toString(),
                                          network.decimals,
                                      ),
                                  )
                                : amountLimits.minCrypto;
                        }
                        if (minCrypto && amount < minCrypto) {
                            return (
                                <Translation
                                    id="TR_SELL_VALIDATION_ERROR_MINIMUM_CRYPTO"
                                    values={{
                                        minimum: (
                                            <FormattedCryptoAmount
                                                value={amountLimits.minCrypto}
                                                symbol={amountLimits.currency}
                                            />
                                        ),
                                    }}
                                />
                            );
                        }

                        let maxCrypto = 0;
                        if (amountLimits.maxCrypto) {
                            maxCrypto = shouldSendInSats
                                ? Number(
                                      amountToSatoshi(
                                          amountLimits.maxCrypto.toString(),
                                          network.decimals,
                                      ),
                                  )
                                : amountLimits.maxCrypto;
                        }
                        if (maxCrypto && amount > maxCrypto) {
                            return (
                                <Translation
                                    id="TR_SELL_VALIDATION_ERROR_MAXIMUM_CRYPTO"
                                    values={{
                                        maximum: (
                                            <FormattedCryptoAmount
                                                value={amountLimits.maxCrypto}
                                                symbol={amountLimits.currency}
                                            />
                                        ),
                                    }}
                                />
                            );
                        }
                    }
                }
            },
        }),
        [activeInput, amountLimits, formState.isSubmitting, network.decimals, shouldSendInSats],
    );

    return (
        <NumberInput
            control={control}
            onFocus={() => {
                setActiveInput(CRYPTO_INPUT);
            }}
            onChange={value => {
                setActiveInput(CRYPTO_INPUT);
                onCryptoAmountChange(value);
            }}
            defaultValue=""
            inputState={getInputState(errors.cryptoInput, cryptoInputValue)}
            name={CRYPTO_INPUT}
            noTopLabel
            maxLength={MAX_LENGTH.AMOUNT}
            rules={cryptoInputRules}
            bottomText={<InputError error={errors[CRYPTO_INPUT]} />}
            innerAddon={
                <Controller
                    control={control}
                    name={CRYPTO_CURRENCY_SELECT}
                    defaultValue={cryptoOption}
                    render={({ onChange, value }) => (
                        <Select
                            onChange={(selected: any) => {
                                setValue('setMaxOutputId', undefined);
                                onChange(selected);
                                setAmountLimits(undefined);
                                setValue(CRYPTO_INPUT, '');
                                setValue(FIAT_INPUT, '');
                                const token = selected.value;
                                if (token === 'ETH' || token === 'TGOR' || token === 'ETC') {
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
                            value={value}
                            isClearable={false}
                            options={getSendCryptoOptions(
                                account,
                                sellInfo?.supportedCryptoCurrencies || new Set(),
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
