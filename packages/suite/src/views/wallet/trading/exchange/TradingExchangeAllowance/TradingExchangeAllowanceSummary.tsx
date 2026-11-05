import { Translation, type TranslationKey } from '@suite/intl';
import { type ExchangeAllowanceCoverage } from '@suite-common/trading';
import { Column, Text, type TextProps } from '@trezor/components';

import { TradingExchangeAllowanceAmount } from './TradingExchangeAllowanceAmount';
import { type TradingExchangeAllowanceToken } from './useTradingExchangeAllowanceFlow';

type TradingExchangeAllowanceSummaryProps = {
    coverage: ExchangeAllowanceCoverage;
    providerName: string;
    token: TradingExchangeAllowanceToken;
    /** Allowance in token units. */
    amount: string;
    /** Token units the swap spends. */
    neededAmount: string | undefined;
};

type SummaryTexts = {
    kind: TranslationKey;
    heading: TranslationKey;
    description: TranslationKey;
    intent: NonNullable<TextProps['intent']>;
};

const getSummaryTexts = (coverage: ExchangeAllowanceCoverage): SummaryTexts => {
    switch (coverage.kind) {
        case 'unlimited':
            return {
                kind: 'TR_EXCHANGE_ALLOWANCE_KIND_UNLIMITED',
                heading: 'TR_EXCHANGE_ALLOWANCE_HEADING_UNLIMITED',
                description: 'TR_EXCHANGE_ALLOWANCE_DESCRIPTION_UNLIMITED',
                intent: 'critical',
            };
        case 'enough':
            return {
                kind: 'TR_EXCHANGE_ALLOWANCE_KIND_ENOUGH',
                heading: 'TR_EXCHANGE_ALLOWANCE_HEADING_ENOUGH',
                description: 'TR_EXCHANGE_ALLOWANCE_DESCRIPTION_ENOUGH',
                intent: 'brand',
            };
        case 'too_low':
            return {
                kind: 'TR_EXCHANGE_ALLOWANCE_KIND_TOO_LOW',
                heading: coverage.requiresReset
                    ? 'TR_EXCHANGE_ALLOWANCE_HEADING_TOO_LOW_RESET'
                    : 'TR_EXCHANGE_ALLOWANCE_HEADING_TOO_LOW_INCREASE',
                description: coverage.requiresReset
                    ? 'TR_EXCHANGE_ALLOWANCE_DESCRIPTION_TOO_LOW_RESET'
                    : 'TR_EXCHANGE_ALLOWANCE_DESCRIPTION_TOO_LOW_INCREASE',
                intent: 'warning',
            };
        case 'none':
            return {
                kind: 'TR_EXCHANGE_ALLOWANCE_KIND_NONE',
                heading: 'TR_EXCHANGE_ALLOWANCE_HEADING_NONE',
                description: 'TR_EXCHANGE_ALLOWANCE_DESCRIPTION_NONE',
                intent: 'neutral',
            };
    }
};

export const TradingExchangeAllowanceSummary = ({
    coverage,
    providerName,
    token,
    amount,
    neededAmount,
}: TradingExchangeAllowanceSummaryProps) => {
    const texts = getSummaryTexts(coverage);
    const values = {
        provider: providerName,
        displaySymbol: token.symbol,
        amount: <TradingExchangeAllowanceAmount amount={amount} token={token} />,
        needed:
            neededAmount !== undefined ? (
                <TradingExchangeAllowanceAmount amount={neededAmount} token={token} />
            ) : (
                ''
            ),
    };

    return (
        <Column gap={4} data-testid="@trading/allowance/summary">
            <Text
                typographyStyle="body-xs"
                intent={texts.intent}
                priority={texts.intent === 'neutral' ? 'secondary' : 'primary'}
                case="uppercase"
                data-testid="@trading/allowance/kind"
            >
                <Translation id={texts.kind} />
            </Text>
            <Text typographyStyle="headline-sm" as="h2">
                <Translation id={texts.heading} values={values} />
            </Text>
            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                <Translation id={texts.description} values={values} />
            </Text>
        </Column>
    );
};
