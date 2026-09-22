import { useFormatters } from '@suite-common/formatters';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Translation } from '@suite-native/intl';

type ApyValueProps = {
    apy: number | null | undefined;
    isNotEarning?: boolean;
    withLabel?: boolean;
};

export const ApyValue = ({ apy, isNotEarning = false, withLabel = false }: ApyValueProps) => {
    const { PercentageFormatter } = useFormatters();

    const getValue = () => {
        if (isNotEarning) {
            return <>{PercentageFormatter.format(0, { withSymbol: true })}</>;
        }

        if (apy == null || !isApyAvailable(apy)) {
            return <Translation id="earn.notAvailableShort" />;
        }

        return <>~{PercentageFormatter.format(apy, { withSymbol: true })}</>;
    };

    const value = getValue();

    if (!withLabel) {
        return value;
    }

    return <Translation id="earn.apyValueWithLabel" values={{ value }} />;
};
