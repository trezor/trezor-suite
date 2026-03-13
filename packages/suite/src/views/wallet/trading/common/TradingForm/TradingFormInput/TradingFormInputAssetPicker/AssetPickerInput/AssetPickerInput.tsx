import { memo, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { FakeSelect } from '@suite/trading';
import {
    type TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingBuyFormProps,
    type TradingExchangeFormProps,
    type TradingSellFormProps,
    selectTradingLoadingAndTimestamp,
} from '@suite-common/trading';
import { type InputProps, Spinner, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { AssetPickerInputContent } from './AssetPickerInputContent';

type TradingFormValues = TradingExchangeFormProps | TradingBuyFormProps | TradingSellFormProps;

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
            return <AssetPickerInputContent name={name} value={value} />;
        }

        if (isLoading) {
            return <Spinner size={20} />;
        }

        return undefined;
    }, [value, isLoading, name]);

    return (
        <FakeSelect
            name={name}
            placeholder={
                !value && !isLoading && placeholder ? translationString(placeholder) : undefined
            }
            isDisabled={disabled}
            onClick={onClick}
            labelLeft={
                label && (
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation id={label} />
                    </Text>
                )
            }
            leftContent={leftContent}
            bottomText={bottomText}
            data-testid={dataTestId}
        />
    );
});
