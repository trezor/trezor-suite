import { useIntl } from 'react-intl';

import { useFormatters } from '@suite-common/formatters';
import { Text, type TextProps } from '@suite-native/atoms';

type PercentageDifferenceFormatterProps = {
    oldValue: number;
    newValue: number;
} & TextProps;

export const PercentageDifferenceFormatter = ({
    oldValue,
    newValue,
    ...rest
}: PercentageDifferenceFormatterProps) => {
    const { SignValueFormatter } = useFormatters();
    const intl = useIntl();

    const hasPriceIncreased = oldValue < newValue;
    const ratio = oldValue === 0 ? 0 : Math.abs((newValue - oldValue) / oldValue);
    const formattedPercentage = intl.formatNumber(ratio, {
        style: 'percent',
        maximumFractionDigits: 0,
    });

    return (
        <Text color={hasPriceIncreased ? 'contentBrand' : 'contentCritical'} {...rest}>
            <SignValueFormatter value={hasPriceIncreased ? 'positive' : 'negative'} />
            {formattedPercentage}
        </Text>
    );
};
