import { isApyAvailable } from '@suite-common/wallet-utils';
import { Translation } from '@suite-native/intl';

type ApyValueProps = {
    apy: number | null | undefined;
};

export const ApyValue = ({ apy }: ApyValueProps) => {
    if (!isApyAvailable(apy)) {
        return <Translation id="earn.notAvailableShort" />;
    }

    return <>{`~${apy}%`}</>;
};
