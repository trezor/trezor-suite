import { type TrxStats } from '@suite-common/earn-staking-api';
import { Translation } from '@suite-lego/intl';

import { formatApr, getRepresentativeApr } from '../utils/voteUtils';

interface TronRepresentativeAprProps {
    address: string;
    representatives: TrxStats | undefined;
}

export const TronRepresentativeApr = ({ address, representatives }: TronRepresentativeAprProps) => {
    const apr = getRepresentativeApr(address, representatives);

    return apr === undefined ? <Translation id="TR_UNKNOWN" /> : <>{formatApr(apr)}</>;
};
