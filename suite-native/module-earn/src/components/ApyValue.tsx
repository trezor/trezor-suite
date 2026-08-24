import { isApyAvailable } from '@suite-common/wallet-utils';
import { Translation } from '@suite-native/intl';

type ApyValueProps = {
    apy: number | null | undefined;
    isNotEarning?: boolean;
    withLabel?: boolean;
};

const getApyValue = ({ apy, isNotEarning }: Pick<ApyValueProps, 'apy' | 'isNotEarning'>) => {
    if (isNotEarning) {
        return <>0%</>;
    }

    if (!isApyAvailable(apy)) {
        return <Translation id="earn.notAvailableShort" />;
    }

    return <>{`~${apy}%`}</>;
};

export const ApyValue = ({ apy, isNotEarning = false, withLabel = false }: ApyValueProps) => {
    const value = getApyValue({ apy, isNotEarning });

    if (!withLabel) {
        return value;
    }

    return <Translation id="earn.apyValueWithLabel" values={{ value }} />;
};
