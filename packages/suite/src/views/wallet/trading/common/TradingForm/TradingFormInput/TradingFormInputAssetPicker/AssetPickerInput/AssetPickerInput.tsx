import { memo, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { type TranslationKey, useTranslation } from '@suite/intl';
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
import { Button } from '@trezor/components';
import { CaretDownIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';

import { AssetPickerInputContent } from './AssetPickerInputContent';

type TradingFormValues = TradingExchangeFormProps | TradingBuyFormProps | TradingSellFormProps;

export interface AssetPickerInputProps {
    name:
        | typeof TRADING_FORM_CRYPTO_CURRENCY_SELECT
        | typeof TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT
        | typeof TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT;
    placeholder?: TranslationKey;
    isDisabled?: boolean;
    dataTestId?: string;
    onClick: () => void;
}

export const AssetPickerInput = memo(function AssetPickerInputInner({
    name,
    placeholder,
    isDisabled,
    dataTestId,
    onClick,
}: AssetPickerInputProps) {
    // React Compiler: `watch` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const { watch } = useFormContext<TradingFormValues>();
    const value = watch(name);
    const { translationString } = useTranslation();
    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isBusy = isLoading || isDiscoveryRunning;

    const content = useMemo(() => {
        if (value) {
            // @ts-expect-error
            return <AssetPickerInputContent name={name} value={value} />;
        }

        return placeholder ? translationString(placeholder) : null;
    }, [value, name, placeholder, translationString]);

    return (
        <Button
            intent="neutral"
            priority="secondary"
            iconRight={CaretDownIcon}
            isDisabled={isDisabled}
            isLoading={isBusy}
            onClick={onClick}
            flex="0 0 auto"
            data-testid={dataTestId}
        >
            {content}
        </Button>
    );
});
