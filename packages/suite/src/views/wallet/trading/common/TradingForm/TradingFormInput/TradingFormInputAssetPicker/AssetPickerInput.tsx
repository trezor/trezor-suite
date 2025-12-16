import { memo, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import styled from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import {
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    selectTradingLoadingAndTimestamp,
} from '@suite-common/trading';
import { Icon, Input, Spinner, Text } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { useSelector, useTranslation } from 'src/hooks/suite';

import { AssetPickerInputContent } from './AssetPickerInputContent';
import { TradingFormValues } from './types';

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
        | typeof TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT;
    label: TranslationKey;
    placeholder?: TranslationKey;
    isDisabled?: boolean;
    dataTestId?: string;
    onClick: () => void;
}

export const AssetPickerInput = memo(function AssetPickerInputInner({
    name,
    placeholder,
    label,
    isDisabled,
    dataTestId,
    onClick,
}: AssetPickerInputProps) {
    const { watch } = useFormContext<TradingFormValues>();
    const value = watch(name);
    const { translationString } = useTranslation();
    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);
    const disabled = isDisabled || isLoading;

    const leftContent = useMemo(() => {
        if (value) return <AssetPickerInputContent value={value} dataTestId={dataTestId} />;

        if (isLoading)
            return (
                <SpinnerWrapper>
                    <Spinner size={24} isGrey={false} />
                </SpinnerWrapper>
            );

        return undefined;
    }, [value, dataTestId, isLoading]);

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
                // Disable the blinking cursor when the input is focused
                readOnly
            />
        </OpenModalButton>
    );
});
