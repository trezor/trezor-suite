import { Translation } from '@suite/intl';
import { isApyAvailable } from '@suite-common/wallet-utils';

interface ApyValueProps {
    apy?: number | null;
}

export const ApyValue = ({ apy }: ApyValueProps) => {
    if (!isApyAvailable(apy)) {
        return <Translation id="TR_EARN_APY_N_A" />;
    }

    return <>~{apy}%</>;
};
