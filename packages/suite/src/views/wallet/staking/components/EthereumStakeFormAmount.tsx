import React, { useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { Switch, variables } from '@trezor/components';
import { Translation, NumberInput, Card } from '@suite-components';
import {
    formatNetworkAmount,
    isDecimalsValid,
    isInteger,
    getInputState,
} from '@suite-common/wallet-utils';
import { MAX_LENGTH } from '@suite-constants/inputs';

import { TypedValidationRules } from '@wallet-types/form';
import { useStakeFormContext } from '@wallet-hooks';
import { InputError } from '@wallet-components';

const Text = styled.div`
    margin-right: 3px;
`;

const SwitchWrapper = styled.div`
    align-items: center;
    display: flex;
    gap: 4px;
`;

const SwitchLabel = styled.label`
    font-size: 14px;
    font-weight: 500;
`;

const StyledNumberInput = styled(NumberInput)`
    display: flex;
    flex: 1;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const TokenBalance = styled.div`
    padding: 0px 6px;
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Symbol = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledCard = styled(Card)`
    display: flex;
    margin-bottom: 8px;
    padding: 32px 42px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 32px 20px;
    }
`;

export const EthereumStakeFormAmount = () => {
    const {
        account,
        network,
        control,
        defaultValues,
        setValue,
        setMax,
        composeRequest,
        getValues,
        formState,
    } = useStakeFormContext();

    const { symbol, availableBalance, balance } = account;

    const inputName = 'outputs[0].amount';
    const isSetMaxActive = getValues('setMaxOutputId') === 0;

    const error = formState.errors?.outputs?.[0]?.amount || undefined;
    // corner-case: do not display "setMaxOutputId" button if FormState got ANY error (setMaxOutputId probably cannot be calculated)
    const isSetMaxVisible = isSetMaxActive && !error && !Object.keys(formState.errors).length;
    const maxSwitchId = 'setMaxOutputId';

    const amountValue = defaultValues.outputs[0].amount;

    const handleInputChange = useCallback(() => {
        if (isSetMaxActive) {
            setValue('setMaxOutputId', undefined);
        }
        composeRequest(inputName);
    }, [setValue, composeRequest, inputName, isSetMaxActive]);

    const cryptoAmountRules = useMemo<TypedValidationRules>(
        () => ({
            required: 'AMOUNT_IS_NOT_SET',
            validate: (value: string) => {
                if (Number.isNaN(Number(value))) {
                    return 'AMOUNT_IS_NOT_NUMBER';
                }

                // ERC20 without decimal places
                if (!network.decimals && !isInteger(value)) {
                    return 'AMOUNT_IS_NOT_INTEGER';
                }

                if (!isDecimalsValid(value, network.decimals)) {
                    return (
                        <Translation
                            key="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                            id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                            values={{ decimals: network.decimals }}
                        />
                    );
                }

                const amountBig = new BigNumber(value);

                if (amountBig.lte(0)) {
                    return 'AMOUNT_IS_TOO_LOW';
                }

                const formattedAvailableBalance = formatNetworkAmount(availableBalance, symbol);

                if (amountBig.gt(formattedAvailableBalance)) {
                    const reserve =
                        account.networkType === 'ripple'
                            ? formatNetworkAmount(account.misc.reserve, symbol)
                            : undefined;

                    if (reserve && amountBig.lt(formatNetworkAmount(balance, symbol))) {
                        return (
                            <Translation id="AMOUNT_IS_MORE_THAN_RESERVE" values={{ reserve }} />
                        );
                    }
                    return 'AMOUNT_IS_NOT_ENOUGH';
                }
            },
        }),
        [account?.misc, account.networkType, availableBalance, balance, network.decimals, symbol],
    );

    return (
        <StyledCard>
            <StyledNumberInput
                inputState={getInputState(error, amountValue)}
                isMonospace
                labelAddonIsVisible={isSetMaxVisible}
                labelAddon={
                    <SwitchWrapper>
                        <Switch
                            isSmall
                            isChecked={isSetMaxActive}
                            id={maxSwitchId}
                            dataTest={maxSwitchId}
                            onChange={() => {
                                setMax(!isSetMaxActive);
                                composeRequest(inputName);
                            }}
                        />
                        <SwitchLabel htmlFor={maxSwitchId}>
                            <Translation id="AMOUNT_STAKE_MAX" />
                        </SwitchLabel>
                    </SwitchWrapper>
                }
                label={
                    <Label>
                        <Text>
                            <Translation id="AMOUNT" />
                        </Text>
                        <TokenBalance>
                            <Translation
                                id="TOKEN_BALANCE"
                                values={{
                                    balance: formatNetworkAmount(
                                        account.availableBalance,
                                        account.symbol,
                                    ),
                                }}
                            />
                            &nbsp;
                            {symbol.toUpperCase()}
                        </TokenBalance>
                    </Label>
                }
                onChange={handleInputChange}
                name={inputName}
                data-test={inputName}
                defaultValue={amountValue}
                maxLength={MAX_LENGTH.AMOUNT}
                rules={cryptoAmountRules}
                control={control}
                innerAddon={<Symbol>{symbol.toUpperCase()}</Symbol>}
                bottomText={error ? <InputError error={error} /> : undefined}
            />
        </StyledCard>
    );
};
