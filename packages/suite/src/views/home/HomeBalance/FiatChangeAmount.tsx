import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { Sign } from '#src/components/suite';

const MIN_EXACT_DECIMALS = 2;

type FiatChangeAmountProps = {
    change: BigNumber;
    isExact?: boolean;
};

export const FiatChangeAmount = ({ change, isExact = false }: FiatChangeAmountProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const shouldRedactNumbers = useShouldRedactNumbers({ strict: false });
    const absoluteChange = asBaseCurrencyAmount(change.abs());
    const exactDecimals = Math.max(MIN_EXACT_DECIMALS, absoluteChange.decimalPlaces() ?? 0);
    const changed = BaseCurrencyAmountFormatter.format(
        absoluteChange,
        isExact
            ? { minimumFractionDigits: exactDecimals, maximumFractionDigits: exactDecimals }
            : {},
    );

    return (
        <Row gap={0} alignItems="center">
            {!change.isZero() && <Sign value={change} />}
            <Text typographyStyle="body-md">
                {shouldRedactNumbers && changed !== null
                    ? redactNumericalSubstring(changed)
                    : changed}
            </Text>
        </Row>
    );
};
