import styled, { useTheme } from 'styled-components';

import { Translation } from '@suite/intl';
import { type ExchangeAllowanceCoverage } from '@suite-common/trading';
import { Column, ProgressBar, Row, Text, type TextIntent } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { AllowanceAmount } from '#src/components/wallet/Allowance/AllowanceAmount';
import { type AllowanceStepToken } from '#src/components/wallet/Allowance/AllowanceStepToken';

const Bar = styled.div`
    overflow: hidden;
    border-radius: 4px;
`;

const COVERAGE_INTENT = {
    unlimited: 'brand',
    enough: 'brand',
    too_low: 'warning',
    none: 'neutral',
} as const satisfies Record<ExchangeAllowanceCoverage['kind'], TextIntent>;

type TradingExchangeAllowanceMeterProps = {
    coverage: ExchangeAllowanceCoverage;
    token: AllowanceStepToken;
    allowedAmount: string;
    neededAmount: string | undefined;
    isLoading: boolean;
};

export const TradingExchangeAllowanceMeter = ({
    coverage,
    token,
    allowedAmount,
    neededAmount,
    isLoading,
}: TradingExchangeAllowanceMeterProps) => {
    const theme = useTheme();
    const intent = COVERAGE_INTENT[coverage.kind];
    const tokenIcon = (
        <TokenIcon
            symbol={token.networkSymbol}
            contractAddress={token.contractAddress}
            size={20}
            placeholder={token.symbol}
        />
    );

    return (
        <Column gap={8} data-testid="@trading/allowance/meter">
            <Row justifyContent="space-between" alignItems="flex-end" gap={8}>
                <Column gap={4}>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_APPROVAL_CURRENT_LIMIT" />
                    </Text>
                    <Row gap={6} alignItems="center">
                        {tokenIcon}
                        <Text intent={intent}>
                            <AllowanceAmount
                                amount={allowedAmount}
                                symbol={token.symbol}
                                decimals={token.decimals}
                                contractAddress={token.contractAddress}
                                isCompact
                                isLoading={isLoading}
                                data-testid="@trading/allowance/allowed"
                            />
                        </Text>
                    </Row>
                </Column>
                {neededAmount !== undefined && (
                    <Column gap={4} alignItems="flex-end">
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_TRADING_SWAP_AMOUNT" />
                        </Text>
                        <Row gap={6} alignItems="center">
                            {tokenIcon}
                            <Text>
                                <FormattedCryptoAmount
                                    value={neededAmount}
                                    symbol={token.symbol}
                                    contractAddress={token.contractAddress}
                                    tokenDecimals={token.decimals}
                                    isCompact
                                    data-testid="@trading/allowance/needed"
                                />
                            </Text>
                        </Row>
                    </Column>
                )}
            </Row>
            <Bar>
                <ProgressBar
                    value={isLoading ? 0 : coverage.coveredRatio}
                    max={1}
                    foregroundColor={
                        intent === 'warning'
                            ? theme.elementFillWarningBold
                            : theme.elementFillBrandBold
                    }
                />
            </Bar>
        </Column>
    );
};
