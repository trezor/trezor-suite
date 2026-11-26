import { type ReactNode, useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import type { TranslationKey } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { toTokenAddress } from '@suite-common/tokens';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { Banner, Card, Column, Row, Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { useSelector } from '#src/hooks/suite/useSelector';
import { validateDecimals } from '#src/utils/suite/validation';

import { EarnAmountCurrencySwitch } from './EarnAmountCurrencySwitch';
import { EarnAmountInputAddon } from './EarnAmountInputAddon';
import { EarnAmountInputHeading } from './EarnAmountInputHeading';

type EarnAmountFormValues = {
    amountInput: string;
    fiatInput?: string;
};

const FIAT_DECIMALS = 2;
// Amount inputs never need the 255-char default; cap them so a long value can't stretch the field
// (an over-long value also breaks the card's max-width and lets sibling amounts grow with it).
const FIAT_INPUT_MAX_LENGTH = 18;
const AMOUNT_INPUT_MAX_LENGTH = 30;

type EarnAmountCardSummaryProps = {
    value: ReactNode;
    labelTranslationId: TranslationKey;
    onMaxClick?: () => void;
};

type EarnAmountCardHeadingProps = {
    amountLabelTranslationId?: TranslationKey;
};

export type EarnAmountCardUnitToggleProps = {
    otherTokenSymbol: string;
    onClick: () => void;
};

export type EarnApproxFiat = {
    symbol: NetworkSymbol;
    tokenContractAddress?: string | null;
};

export type EarnAmountCardFiatToggleProps = {
    currency: 'crypto' | 'fiat';
    fiatSymbol: string;
    onToggle: () => void;
    onFiatAmountChange: (value: string) => void;
};

type EarnAmountCardProps = {
    tokenSymbol: ReactNode;
    testIdPrefix: string;
    decimals?: number;
    summary?: EarnAmountCardSummaryProps;
    heading?: EarnAmountCardHeadingProps;
    unitToggle?: EarnAmountCardUnitToggleProps;
    fiatToggle?: EarnAmountCardFiatToggleProps;
    warning?: ReactNode;
    isDisabled?: boolean;
    approxFiat?: EarnApproxFiat;
};

export const EarnAmountCard = ({
    tokenSymbol,
    testIdPrefix,
    decimals,
    summary,
    heading,
    unitToggle,
    fiatToggle,
    warning,
    isDisabled = false,
    approxFiat,
}: EarnAmountCardProps) => {
    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();
    const {
        control,
        formState: { errors },
        trigger,
    } = useFormContext<EarnAmountFormValues>();

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
        <EarnAmountCurrencySwitch
            currency={isFiatMode ? tokenSymbol : fiatToggle.fiatSymbol}
            onClick={fiatToggle.onToggle}
            isUnderlined
            data-testid={`${testIdPrefix}/fiat-switch`}
        />
    ) : undefined;

    const unitSwitch = unitToggle ? (
        <EarnAmountCurrencySwitch
            currency={unitToggle.otherTokenSymbol}
            onClick={unitToggle.onClick}
            isUnderlined
            data-testid={`${testIdPrefix}/unit-toggle-button`}
        />
    ) : undefined;

    const activeError = isFiatMode ? errors.fiatInput : errors.amountInput;

    return (
        <Card paddingType="none">
            <Column gap={8} width="100%" padding={{ vertical: 16, horizontal: 20 }}>
                <EarnAmountInputHeading
                    label={<Translation id={heading?.amountLabelTranslationId ?? 'AMOUNT'} />}
                    labelTestId={`${testIdPrefix}/amount-label`}
                    gap={16}
                    currencySwitch={unitSwitch ?? fiatSwitch}
                />
                <NumberInput
                    name={isFiatMode ? 'fiatInput' : 'amountInput'}
                    data-testid={`${testIdPrefix}/${isFiatMode ? 'fiat-input' : 'amount-input'}`}
                    locale={locale}
                    control={control}
                    rules={isFiatMode ? fiatRules : rules}
                    onChange={isFiatMode ? fiatToggle.onFiatAmountChange : undefined}
                    maxLength={isFiatMode ? FIAT_INPUT_MAX_LENGTH : AMOUNT_INPUT_MAX_LENGTH}
                    isDisabled={isDisabled}
                    rightContent={
                        <EarnAmountInputAddon
                            unit={isFiatMode ? fiatToggle.fiatSymbol : tokenSymbol}
                            onMaxClick={summary?.onMaxClick}
                            maxButtonTestId={`${testIdPrefix}/max-button`}
                            data-testid={isFiatMode ? undefined : `${testIdPrefix}/amount-unit`}
                        />
                    }
                />

                {summary && (
                    <Row alignItems="center" gap={8} width="100%" flexWrap="wrap">
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
                                            typographyStyle="body-sm"
                                            textWrap="nowrap"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            {value}
                                        </Text>
                                    ) : null
                                }
                            </BaseCurrencyValue>
                        )}
                        <Row
                            justifyContent="flex-end"
                            alignItems="center"
                            gap={4}
                            margin={{ left: 'auto' }}
                            flexWrap="wrap"
                        >
                            <Text
                                typographyStyle="body-sm"
                                textWrap="nowrap"
                                intent="neutral"
                                priority="secondary"
                                data-testid={`${testIdPrefix}/summary-label`}
                            >
                                <Translation id={summary.labelTranslationId} />:
                            </Text>
                            <Text
                                typographyStyle="body-sm"
                                textWrap="nowrap"
                                data-testid={`${testIdPrefix}/summary-amount-with-symbol`}
                            >
                                {summary.value}
                            </Text>
                        </Row>
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
