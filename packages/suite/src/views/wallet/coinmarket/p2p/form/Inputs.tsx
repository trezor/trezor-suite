import React, { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import Bignumber from 'bignumber.js';
import { FIAT } from '@suite-config';
import { Translation, NumberInput } from '@suite-components';
import { MAX_LENGTH } from '@suite-constants/inputs';
import { getInputState, isDecimalsValid } from '@suite-common/wallet-utils';
import { CoinLogo, Select } from '@trezor/components';
import { useCoinmarketP2pFormContext } from '@wallet-hooks/useCoinmarketP2pForm';
import { InputError } from '@wallet-components';
import { Wrapper } from '@wallet-views/coinmarket';
import { buildOption } from '@wallet-utils/coinmarket/coinmarketUtils';
import { TypedValidationRules } from '@wallet-types/form';

const Left = styled.div`
    display: flex;
    flex: 0.827;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-bottom: 22px;
`;

const TextLabel = styled.div`
    padding: 0 8px 0 12px;
`;

const CoinLabel = styled.div`
    padding-left: 4px;
`;

export const Inputs = () => {
    const { account, errors, control, formState, defaultCurrency, p2pInfo, getValues } =
        useCoinmarketP2pFormContext();
    const fiatInput = 'fiatInput';
    const currencySelect = 'currencySelect';
    const fiatInputValue = getValues(fiatInput);

    const fiatInputRules = useMemo<TypedValidationRules>(
        () => ({
            validate: (value: string) => {
                if (!value) {
                    if (formState.isSubmitting) {
                        return <Translation id="TR_P2P_VALIDATION_ERROR_EMPTY" />;
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

                if (!isDecimalsValid(value, 2)) {
                    return (
                        <Translation
                            id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                            values={{ decimals: 2 }}
                        />
                    );
                }
            },
        }),
        [formState.isSubmitting],
    );

    return (
        <Wrapper responsiveSize="LG">
            <Left>
                <NumberInput
                    control={control}
                    noTopLabel
                    rules={fiatInputRules}
                    inputState={getInputState(errors.fiatInput, fiatInputValue)}
                    name={fiatInput}
                    maxLength={MAX_LENGTH.AMOUNT}
                    bottomText={<InputError error={errors[fiatInput]} />}
                    innerAddon={
                        <Controller
                            control={control}
                            name={currencySelect}
                            defaultValue={defaultCurrency}
                            render={({ onChange, value }) => (
                                <Select
                                    options={FIAT.currencies
                                        .filter(c => p2pInfo?.supportedCurrencies.has(c))
                                        .map((currency: string) => buildOption(currency))}
                                    isSearchable
                                    value={value}
                                    isClearable={false}
                                    minWidth="58px"
                                    isClean
                                    hideTextCursor
                                    onChange={(selected: any) => {
                                        onChange(selected);
                                    }}
                                />
                            )}
                        />
                    }
                    data-test="@coinmarket/p2p/fiat-input"
                />
            </Left>
            <Right>
                <TextLabel>
                    <Translation id="TR_P2P_WORTH_OF" />
                </TextLabel>
                <CoinLogo size={18} symbol={account.symbol} />
                <CoinLabel>{account.symbol.toUpperCase()}</CoinLabel>
            </Right>
        </Wrapper>
    );
};
