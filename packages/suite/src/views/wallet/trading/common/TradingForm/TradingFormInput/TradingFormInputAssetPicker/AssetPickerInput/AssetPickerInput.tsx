import { memo, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import styled from 'styled-components';

import { Translation, TranslationKey, useTranslation } from '@suite/intl';
import {
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TradingBuyFormProps,
    TradingExchangeFormProps,
    TradingSellFormProps,
    selectTradingLoadingAndTimestamp,
} from '@suite-common/trading';
import { Icon, Input, InputProps, Spinner, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { AssetPickerInputContent } from './AssetPickerInputContent';

type TradingFormValues = TradingExchangeFormProps | TradingBuyFormProps | TradingSellFormProps;

const OpenModalButton = styled.button`
    border: unset;
    background: unset;
    box-shadow: unset;
    font-size: inherit;

    cursor: pointer;

    & input {
        cursor: pointer;
    }
`;

const SpinnerWrapper = styled.div`
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
`;
export interface AssetPickerInputProps {
    name:
        | typeof TRADING_FORM_CRYPTO_CURRENCY_SELECT
        | typeof TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT
        | typeof TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT;
    label: TranslationKey;
    placeholder?: TranslationKey;
    isDisabled?: boolean;
    dataTestId?: string;
    onClick: () => void;
    bottomText?: InputProps['bottomText'];
}

export const AssetPickerInput = memo(function AssetPickerInputInner({
    name,
    placeholder,
    label,
    isDisabled,
    dataTestId,
    onClick,
    bottomText,
}: AssetPickerInputProps) {
    const { watch } = useFormContext<TradingFormValues>();
    const value = watch(name);
    const { translationString } = useTranslation();
    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);
    const disabled = isDisabled || isLoading;

    const leftContent = useMemo(() => {
        if (value) {
            // @ts-expect-error
            return <AssetPickerInputContent name={name} value={value} dataTestId={dataTestId} />;
        }

        if (isLoading) {
            return (
                <SpinnerWrapper>
                    <Spinner size={24} isGrey={false} />
                </SpinnerWrapper>
            );
        }

        return undefined;
    }, [value, isLoading, name, dataTestId]);

    return (
        <OpenModalButton
            onClick={e => {
                e.preventDefault();
                e.stopPropagation();

                if (!disabled) {
                    onClick();
                }
            }}
        >
            <Input
                name={name}
                placeholder={
                    !value && !isLoading && placeholder ? translationString(placeholder) : undefined
                }
                isDisabled={disabled}
                data-testid={`${dataTestId}/input`}
                labelLeft={
                    label && (
                        <Text typographyStyle="body" color="textSubdued">
                            <Translation id={label} />
                        </Text>
                    )
                }
                rightContent={<Icon name="caretDown" size={20} />}
                leftContent={leftContent}
                bottomText={bottomText}
                // Disable the blinking cursor when the input is focused
                readOnly
            />
        </OpenModalButton>
    );
});
