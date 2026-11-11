import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation, type TranslationId } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, Row, Text } from '@trezor/components';
import { type Color } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite/useSelector';

type LegendSquareProps = {
    color: Color;
};

const LegendSquare = ({ color }: LegendSquareProps) => (
    <Box width={12} height={12} borderRadius={4} backgroundColor={color} />
);

type EarnBalanceBreakdownRowProps = {
    amount: string;
    isApproximate?: boolean;
    translationId: TranslationId;
    color: Color;
};

export const EarnBalanceBreakdownRow = ({
    amount,
    isApproximate = false,
    translationId,
    color,
}: EarnBalanceBreakdownRowProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const baseCurrency = useSelector(selectBaseCurrency);

    return (
        <Row gap={12} width="100%" alignItems="center">
            <LegendSquare color={color} />

            <Row gap={6} flex="1" alignItems="center" justifyContent="space-between">
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id={translationId} />
                </Text>

                <HiddenPlaceholder>
                    <Text typographyStyle="body-md-strong">
                        {isApproximate && '≈ '}

                        <BaseCurrencyAmountFormatter
                            value={asBaseCurrencyAmount(new BigNumber(amount))}
                            currency={baseCurrency}
                        />
                    </Text>
                </HiddenPlaceholder>
            </Row>
        </Row>
    );
};
