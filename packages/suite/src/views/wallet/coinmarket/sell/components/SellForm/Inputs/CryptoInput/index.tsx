import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { Select, Input, CoinLogo } from '@trezor/components';
import Bignumber from 'bignumber.js';
import { Controller } from 'react-hook-form';
import { useCoinmarketSellFormContext } from '@wallet-hooks/useCoinmarketSellForm';
import { isDecimalsValid } from '@wallet-utils/validation';
import { InputError } from '@wallet-components';
import { MAX_LENGTH } from '@suite-constants/inputs';
import {
    CRYPTO_CURRENCY_SELECT,
    CRYPTO_INPUT,
    FIAT_INPUT,
} from '@suite/types/wallet/coinmarketSellForm';

interface Props {
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

const CryptoInput = ({ activeInput, setActiveInput }: Props) => {
    const {
        register,
        errors,
        account,
        network,
        control,
        formState,
        amountLimits,
        onCryptoAmountChange,
    } = useCoinmarketSellFormContext();

    const uppercaseSymbol = account.symbol.toUpperCase();
    const cryptoOption = {
        value: uppercaseSymbol,
        label: uppercaseSymbol,
    };

    return (
        <Input
            onFocus={() => {
                setActiveInput(CRYPTO_INPUT);
            }}
            onChange={event => {
                setActiveInput(CRYPTO_INPUT);
                onCryptoAmountChange(event.target.value);
            }}
            defaultValue=""
            state={errors[CRYPTO_INPUT] ? 'error' : undefined}
            name={CRYPTO_INPUT}
            noTopLabel
            maxLength={MAX_LENGTH.AMOUNT}
            innerRef={register({
                validate: (value: string) => {
                    if (activeInput === CRYPTO_INPUT) {
                        if (!value) {
                            if (formState.isSubmitting) {
                                return <Translation id="TR_SELL_VALIDATION_ERROR_EMPTY" />;
                            }
                            return;
                        }

                        const amountBig = new Bignumber(value);

                        if (amountBig.isNaN()) {
                            return <Translation id="AMOUNT_IS_NOT_NUMBER" />;
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
                            if (amountLimits.minCrypto && amount < amountLimits.minCrypto) {
                                return (
                                    <Translation
                                        id="TR_SELL_VALIDATION_ERROR_MINIMUM_CRYPTO"
                                        values={{
                                            minimum: amountLimits.minCrypto,
                                            currency: amountLimits.currency,
                                        }}
                                    />
                                );
                            }
                            if (amountLimits.maxCrypto && amount > amountLimits.maxCrypto) {
                                return (
                                    <Translation
                                        id="TR_SELL_VALIDATION_ERROR_MAXIMUM_CRYPTO"
                                        values={{
                                            maximum: amountLimits.maxCrypto,
                                            currency: amountLimits.currency,
                                        }}
                                    />
                                );
                            }
                        }
                    }
                },
            })}
            bottomText={<InputError error={errors[CRYPTO_INPUT]} />}
            innerAddon={
                <Controller
                    control={control}
                    name={CRYPTO_CURRENCY_SELECT}
                    defaultValue={cryptoOption}
                    render={({ onChange, value }) => (
                        <Select
                            onChange={(selected: any) => {
                                onChange(selected);
                            }}
                            value={value}
                            isClearable={false}
                            options={[cryptoOption]}
                            isClean
                            hideTextCursor
                            isDropdownVisible={false}
                            isDisabled
                            minWidth="85px"
                            formatOptionLabel={(option: any) => (
                                <Option>
                                    <CoinLogo size={18} symbol={account.symbol} />
                                    <Label>{option.label}</Label>
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
