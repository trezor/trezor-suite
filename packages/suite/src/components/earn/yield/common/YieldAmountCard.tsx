import { type ReactNode, useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import type { TranslationKey } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { YieldFlowFormValues } from '@suite-common/wallet-core';
import { toTokenAddress } from '@suite-common/wallet-types';
import { Banner, Button, Card, Column, Row, Text, TextButton } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useSelector } from 'src/hooks/suite';
import { validateDecimals } from 'src/utils/suite/validation';

import { TruncatedAmount } from './TruncatedAmount';

const FIAT_DECIMALS = 2;
// Amount inputs never need the 255-char default; cap them so a long value can't stretch the field
// (an over-long value also breaks the card's max-width and lets sibling amounts grow with it).
const FIAT_INPUT_MAX_LENGTH = 18;
const AMOUNT_INPUT_MAX_LENGTH = 30;

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

export type YieldAmountCardFiatToggleProps = {
    currency: 'crypto' | 'fiat';
    fiatSymbol: string;
    onToggle: () => void;
    onFiatAmountChange: (value: string) => void;
};

type YieldAmountCardProps = {
    tokenSymbol: string;
    decimals?: number;
    summary?: YieldAmountCardSummaryProps;
    heading?: YieldAmountCardHeadingProps;
    unitToggle?: YieldAmountCardUnitToggleProps;
    fiatToggle?: YieldAmountCardFiatToggleProps;
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
    fiatToggle,
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

    const isFiatMode = fiatToggle?.currency === 'fiat';

    const rules = useMemo(
        () =>
            decimals !== undefined
                ? { validate: { decimals: validateDecimals(translationString, { decimals }) } }
                : undefined,
        [translationString, decimals],
    );

    const fiatRules = useMemo(
        () => ({
            validate: {
                decimals: validateDecimals(translationString, { decimals: FIAT_DECIMALS }),
            },
        }),
        [translationString],
    );

    const amountInput = useWatch({ control, name: 'amountInput' });
    const fiatInput = useWatch({ control, name: 'fiatInput' });

    useEffect(() => {
        if (amountInput) {
            trigger('amountInput');
        }
    }, [amountInput, trigger]);

    useEffect(() => {
        if (fiatInput && isFiatMode) {
            trigger('fiatInput');
        }
    }, [fiatInput, isFiatMode, trigger]);

    // The switch offers the opposite unit to the one currently active.
    const fiatSwitch = fiatToggle ? (
        <TextButton
            type="button"
            size="small"
            onClick={fiatToggle.onToggle}
            isUnderlined
            data-testid="@yield/form/fiat-switch"
        >
            <Translation
                id="TR_EARN_ENTER_AMOUNT_IN"
                values={{ currency: isFiatMode ? tokenSymbol : fiatToggle.fiatSymbol }}
            />
        </TextButton>
    ) : undefined;

    const unitSwitch = unitToggle ? (
        <TextButton type="button" size="small" onClick={unitToggle.onClick} isUnderlined>
            <Translation
                id="TR_EARN_YIELD_ENTER_AMOUNT_IN_TOKEN"
                values={{ tokenSymbol: unitToggle.otherTokenSymbol }}
            />
        </TextButton>
    ) : undefined;

    const activeError = isFiatMode ? errors.fiatInput : errors.amountInput;

    return (
        <Card paddingType="none">
            <Column gap={8} width="100%" padding={{ vertical: 16, horizontal: 20 }}>
                <Row justifyContent="space-between" alignItems="center" gap={16}>
                    <Text typographyStyle="body-md" data-testid="@yield/form/amount-label">
                        <Translation id={heading?.amountLabelTranslationId ?? 'AMOUNT'} />
                    </Text>
                    {unitSwitch ?? fiatSwitch}
                </Row>
                {isFiatMode ? (
                    <NumberInput
                        name="fiatInput"
                        data-testid="@yield/form/fiat-input"
                        locale={locale}
                        control={control}
                        rules={fiatRules}
                        onChange={fiatToggle?.onFiatAmountChange}
                        maxLength={FIAT_INPUT_MAX_LENGTH}
                        isDisabled={isDisabled}
                        rightContent={
                            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                                {fiatToggle?.fiatSymbol}
                            </Text>
                        }
                    />
                ) : (
                    <NumberInput
                        name="amountInput"
                        data-testid="@yield/form/amount-input"
                        locale={locale}
                        control={control}
                        rules={rules}
                        maxLength={AMOUNT_INPUT_MAX_LENGTH}
                        isDisabled={isDisabled}
                        rightContent={
                            <Text
                                typographyStyle="body-md"
                                intent="neutral"
                                priority="secondary"
                                data-testid="@yield/form/amount-unit"
                            >
                                {tokenSymbol}
                            </Text>
                        }
                    />
                )}

                {summary && (
                    <Row justifyContent="space-between" alignItems="center" gap={8} width="100%">
                        <Row alignItems="center" gap={8} minWidth={0}>
                            <Text
                                typographyStyle="body-md"
                                intent="neutral"
                                priority="secondary"
                                data-testid="@yield/form/summary-label"
                            >
                                <Translation id={summary.labelTranslationId} />:
                            </Text>
                            <TruncatedAmount>
                                <Text
                                    typographyStyle="body-md"
                                    intent="neutral"
                                    priority="secondary"
                                    data-testid="@yield/form/summary-amount-with-symbol"
                                >
                                    {summary.value}
                                </Text>
                            </TruncatedAmount>
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
                        {/* In fiat mode the user already types the fiat amount, so converting
                        it back would just restate the input. */}
                        {approxFiat && !isFiatMode && (
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

                {activeError?.message && (
                    <Banner intent="warning" description={<Text>{activeError.message}</Text>} />
                )}

                {warning}
            </Column>
        </Card>
    );
};
