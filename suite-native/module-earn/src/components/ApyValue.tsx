import { Translation } from '@suite-native/intl';

type ApyValueProps = {
    apy: number | null | undefined;
};

export const ApyValue = ({ apy }: ApyValueProps) => {
    if (apy == null) {
        return <Translation id="earn.apyNotAvailable" />;
    }

    return <>{`~${apy}%`}</>;
};
