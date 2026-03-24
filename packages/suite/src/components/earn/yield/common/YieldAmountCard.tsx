import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { Translation } from '@suite/intl';
import type { TranslationKey } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { formInputsMaxLength } from '@suite-common/validators';
import { Button, Card, Column, Row, Text, TextButton } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

import type { YieldFlowFormValues } from './types';

type YieldAmountCardSummaryProps = {
    value: string;
    labelTranslationId?: TranslationKey;
    onMaxClick?: () => void;
};

type YieldAmountCardHeadingProps = {
    amountLabelTranslationId?: TranslationKey;
    switchCurrencyLabel?: string;
    isSwitchDisabled?: boolean;
    onSwitchCurrency?: () => void;
};

type YieldAmountCardProps = {
    amount: string;
    tokenSymbol: string;
    summary?: YieldAmountCardSummaryProps;
    heading?: YieldAmountCardHeadingProps;
    onAmountChange: (amount: string) => void;
};

export const YieldAmountCard = ({
    amount,
    tokenSymbol,
    summary,
    heading,
    onAmountChange,
}: YieldAmountCardProps) => {
    const locale = useSelector(selectLanguage);
    const { control, setValue } = useFormContext<YieldFlowFormValues>();

    useEffect(() => {
        setValue('amountInput', amount);
    }, [amount, setValue]);

    return (
        <Card paddingType="none">
            <Column gap={8} width="100%" padding={{ vertical: 16, horizontal: 20 }}>
                <Row justifyContent="space-between" alignItems="center" gap={16}>
                    <Text typographyStyle="body-md">
                        <Translation
                            id={
                                heading?.amountLabelTranslationId ??
                                'TR_EARN_YIELD_AMOUNT_TO_SUPPLY'
                            }
                        />
                    </Text>
                    {heading?.switchCurrencyLabel && heading.onSwitchCurrency && (
                        <TextButton
                            size="small"
                            type="button"
                            onClick={heading.onSwitchCurrency}
                            isDisabled={heading.isSwitchDisabled === true}
                        >
                            <Translation
                                id="TR_TRADING_ENTER_AMOUNT_IN"
                                values={{ currency: heading.switchCurrencyLabel }}
                            />
                        </TextButton>
                    )}
                </Row>
                <NumberInput
                    name="amountInput"
                    locale={locale}
                    control={control}
                    onChange={onAmountChange}
                    maxLength={formInputsMaxLength.amount}
                    rightContent={
                        <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                            {tokenSymbol}
                        </Text>
                    }
                />

                {summary && (
                    <Row alignItems="center" gap={8} flexWrap="wrap">
                        <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                            <Translation id={summary.labelTranslationId ?? 'TR_STAKE_AVAILABLE'} />
                            {`: ${summary.value}`}
                        </Text>
                        {summary.onMaxClick && (
                            <Button
                                type="button"
                                size="small"
                                intent="neutral"
                                priority="secondary"
                                onClick={() => summary.onMaxClick?.()}
                            >
                                <Translation id="TR_FRACTION_BUTTONS_MAX" />
                            </Button>
                        )}
                    </Row>
                )}
            </Column>
        </Card>
    );
};
