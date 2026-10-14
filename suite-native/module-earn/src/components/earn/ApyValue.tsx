import { isApyAvailable } from '@suite-common/wallet-utils';
import { Translation } from '@suite-native/intl';

type ApyValueProps = {
    apy: number | null | undefined;
    isNotEarning?: boolean;
    withLabel?: boolean;
    rateType?: 'apy' | 'apr';
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

export const ApyValue = ({
    apy,
    isNotEarning = false,
    withLabel = false,
    rateType = 'apy',
}: ApyValueProps) => {
    const value = getApyValue({ apy, isNotEarning });

    if (!withLabel) {
        return value;
    }

    return (
        <Translation
            id={rateType === 'apr' ? 'earn.aprValueWithLabel' : 'earn.apyValueWithLabel'}
            values={{ value }}
        />
    );
};
