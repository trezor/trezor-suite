import { memo, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { FakeSelect } from '@suite/trading';
import { useSelector } from '@suite-common/redux-utils';
import {
    type TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    type TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingBuyFormProps,
    type TradingExchangeFormProps,
    type TradingSellFormProps,
    selectTradingLoadingAndTimestamp,
} from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type InputProps, Spinner, Text } from '@trezor/components';

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
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isBusy = isLoading || isDiscoveryRunning;
    const disabled = isDisabled || isBusy;

    const leftContent = useMemo(() => {
        if (value) {
            // @ts-expect-error
            return <AssetPickerInputContent name={name} value={value} />;
        }

        if (isBusy) {
            return <Spinner size={20} />;
        }

        return undefined;
    }, [value, isBusy, name]);

    return (
        <FakeSelect
            name={name}
            placeholder={
                !value && !isBusy && placeholder ? translationString(placeholder) : undefined
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
