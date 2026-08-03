import { type ReactNode, useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import type { TranslationKey } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { formInputsMaxLength } from '@suite-common/validators';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { YieldFlowFormValues } from '@suite-common/wallet-core';
import { toTokenAddress } from '@suite-common/wallet-types';
import { Banner, Button, Card, Column, Row, Text, TextButton } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useSelector } from 'src/hooks/suite';
import { validateDecimals } from 'src/utils/suite/validation';

type YieldAmountCardSummaryProps = {
    value: ReactNode;
    labelTranslationId: TranslationKey;
    onMaxClick?: () => void;
};

type YieldAmountCardHeadingProps = {
    amountLabelTranslationId?: TranslationKey;
};

export type YieldAmountCardUnitToggleProps = {
    otherTokenSymbol: string;
    onClick: () => void;
};

export type YieldApproxFiat = {
    symbol: NetworkSymbol;
    tokenContractAddress?: string | null;
};

type YieldAmountCardProps = {
    tokenSymbol: string;
    decimals?: number;
    summary?: YieldAmountCardSummaryProps;
    heading?: YieldAmountCardHeadingProps;
    unitToggle?: YieldAmountCardUnitToggleProps;
    warning?: ReactNode;
    isDisabled?: boolean;
    approxFiat?: YieldApproxFiat;
};

export const YieldAmountCard = ({
    tokenSymbol,
    decimals,
    summary,
    heading,
    unitToggle,
    warning,
    isDisabled = false,
    approxFiat,
}: YieldAmountCardProps) => {
    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();
    const {
        control,
        formState: { errors },
        trigger,
    } = useFormContext<YieldFlowFormValues>();

    const rules = useMemo(
        () =>
            decimals !== undefined
                ? { validate: { decimals: validateDecimals(translationString, { decimals }) } }
                : undefined,
        [translationString, decimals],
    );

    const amountInput = useWatch({ control, name: 'amountInput' });

    useEffect(() => {
        if (amountInput) {
            trigger('amountInput');
        }
    }, [amountInput, trigger]);

    return (
        <Card paddingType="none">
            <Column gap={8} width="100%" padding={{ vertical: 16, horizontal: 20 }}>
                <Row justifyContent="space-between" alignItems="center" gap={16}>
                    <Text typographyStyle="body-md">
                        <Translation id={heading?.amountLabelTranslationId ?? 'AMOUNT'} />
                    </Text>
                    {unitToggle && (
                        <TextButton
                            type="button"
                            size="small"
                            onClick={unitToggle.onClick}
                            isUnderlined
                        >
                            <Translation
                                id="TR_EARN_YIELD_ENTER_AMOUNT_IN_TOKEN"
                                values={{ tokenSymbol: unitToggle.otherTokenSymbol }}
                            />
                        </TextButton>
                    )}
                </Row>
                <NumberInput
                    name="amountInput"
                    data-testid="@yield/form/amount-input"
                    locale={locale}
                    control={control}
                    rules={rules}
                    maxLength={formInputsMaxLength.amount}
                    isDisabled={isDisabled}
                    rightContent={
                        <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                            {tokenSymbol}
                        </Text>
                    }
                />

                {summary && (
                    <Row justifyContent="space-between" alignItems="center" gap={8} width="100%">
                        <Row alignItems="center" gap={8}>
                            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                                <Translation id={summary.labelTranslationId} />
                                {': '}
                                {summary.value}
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
                        {approxFiat && (
                            <BaseCurrencyValue
                                amount={amountInput ?? ''}
                                symbol={approxFiat.symbol}
                                tokenAddress={
                                    approxFiat.tokenContractAddress
                                        ? toTokenAddress(approxFiat.tokenContractAddress)
                                        : undefined
                                }
                                showApproximationIndicator
                            >
                                {({ value }) =>
                                    value ? (
                                        <Text
                                            typographyStyle="body-xs"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            {value}
                                        </Text>
                                    ) : null
                                }
                            </BaseCurrencyValue>
                        )}
                    </Row>
                )}

                {errors.amountInput?.message && (
                    <Banner
                        intent="warning"
                        description={<Text>{errors.amountInput.message}</Text>}
                    />
                )}

                {warning}
            </Column>
        </Card>
    );
};
