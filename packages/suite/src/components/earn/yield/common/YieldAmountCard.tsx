import { type ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

import { Translation } from '@suite/intl';
import type { TranslationKey } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { formInputsMaxLength } from '@suite-common/validators';
import { Button, Card, Column, Row, Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

import type { YieldFlowFormValues } from '../types';

type YieldAmountCardSummaryProps = {
    value: ReactNode;
    labelTranslationId?: TranslationKey;
    onMaxClick?: () => void;
};

type YieldAmountCardHeadingProps = {
    amountLabelTranslationId?: TranslationKey;
};

type YieldAmountCardProps = {
    tokenSymbol: string;
    summary?: YieldAmountCardSummaryProps;
    heading?: YieldAmountCardHeadingProps;
    warning?: ReactNode;
    isDisabled?: boolean;
};

export const YieldAmountCard = ({
    tokenSymbol,
    summary,
    heading,
    warning,
    isDisabled = false,
}: YieldAmountCardProps) => {
    const locale = useSelector(selectLanguage);
    const { control } = useFormContext<YieldFlowFormValues>();

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
                </Row>
                <NumberInput
                    name="amountInput"
                    locale={locale}
                    control={control}
                    maxLength={formInputsMaxLength.amount}
                    isDisabled={isDisabled}
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
                )}

                {warning}
            </Column>
        </Card>
    );
};
