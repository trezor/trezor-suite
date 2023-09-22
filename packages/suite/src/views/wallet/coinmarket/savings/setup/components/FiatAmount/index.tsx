import { useCallback } from 'react';
import styled from 'styled-components';
import { CustomPaymentAmountKey } from 'src/constants/wallet/coinmarket/savings';
import { variables } from '@trezor/components';
import { Control, Controller, FieldError } from 'react-hook-form';
import { Translation, NumberInput } from 'src/components/suite';
import { StyledSelectBar } from 'src/views/wallet/coinmarket';
import { useFormatters } from '@suite-common/formatters';
import { Savings } from 'src/types/wallet/coinmarketCommonTypes';
import { useTranslation } from 'src/hooks/suite';

const StyledInput = styled(NumberInput)`
    display: flex;
    margin-top: 12px;
    height: 40px;
` as typeof NumberInput; // Styled wrapper doesn't preserve type argument, see https://github.com/styled-components/styled-components/issues/1803#issuecomment-857092410

const CustomAmountInputErrorWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_RED};
    margin-top: 6px;
`;

const Label = styled.div`
    padding-right: 20px;
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    margin-bottom: 11px;
`;

interface FiatAmountProps {
    control: Control<Savings>;
    defaultFiatAmount?: string;
    fiatAmount?: string;
    fiatCurrency?: string;
    paymentAmounts: string[];
    minimumPaymentAmountLimit?: number;
    maximumPaymentAmountLimit?: number;
    customFiatAmountError?: FieldError;
}

const FiatAmount = ({
    defaultFiatAmount,
    fiatAmount,
    fiatCurrency,
    paymentAmounts,
    minimumPaymentAmountLimit,
    maximumPaymentAmountLimit,
    customFiatAmountError,
    control,
}: FiatAmountProps) => {
    const { FiatAmountFormatter } = useFormatters();
    const { translationString } = useTranslation();

    const rules = {
        required: translationString('TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_REQUIRED'),
        validate: (value: string) => {
            const numberValue = Number(value);
            if (minimumPaymentAmountLimit && numberValue < minimumPaymentAmountLimit) {
                return translationString('TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_MINIMUM', {
                    amount: minimumPaymentAmountLimit,
                });
            }
            if (maximumPaymentAmountLimit && numberValue > maximumPaymentAmountLimit) {
                return translationString('TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_MAXIMUM', {
                    amount: maximumPaymentAmountLimit,
                });
            }
        },
    };

    const getFiatAmountOptions = useCallback(
        () =>
            paymentAmounts.map(amount => ({
                label: !Number.isNaN(Number(amount)) ? (
                    <FiatAmountFormatter
                        value={amount}
                        currency={fiatCurrency}
                        minimumFractionDigits={0}
                        maximumFractionDigits={0}
                    />
                ) : (
                    <Translation id="TR_SAVINGS_SETUP_FIAT_AMOUNT_CUSTOM" />
                ),
                value: amount,
            })),
        [paymentAmounts, fiatCurrency, FiatAmountFormatter],
    );

    return (
        <>
            <Label>
                <Translation id="TR_SAVINGS_SETUP_FIAT_AMOUNT_LABEL" />
            </Label>

            <div>
                <Controller
                    control={control}
                    name="fiatAmount"
                    defaultValue={defaultFiatAmount}
                    render={({ field: { onChange, value } }) => (
                        <StyledSelectBar
                            onChange={onChange}
                            selectedOption={value}
                            options={getFiatAmountOptions()}
                        />
                    )}
                />

                {fiatAmount === CustomPaymentAmountKey && (
                    <StyledInput
                        control={control}
                        name="customFiatAmount"
                        noTopLabel
                        size="small"
                        autoFocus
                        inputState={customFiatAmountError ? 'error' : 'success'}
                        rules={rules}
                    />
                )}
            </div>

            <CustomAmountInputErrorWrapper>
                {customFiatAmountError?.message}
            </CustomAmountInputErrorWrapper>
        </>
    );
};

export default FiatAmount;
