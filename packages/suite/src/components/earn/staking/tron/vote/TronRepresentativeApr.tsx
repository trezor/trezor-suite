import { Translation } from '@suite/intl';
import { type TrxStats } from '@suite-common/earn-staking-api';

import { useFormatApy } from 'src/hooks/earn/useFormatApy';

import { getRepresentativeApr } from '../utils/voteUtils';

interface TronRepresentativeAprProps {
    address: string;
    representatives: TrxStats | undefined;
}

export const TronRepresentativeApr = ({ address, representatives }: TronRepresentativeAprProps) => {
    const formatApyValue = useFormatApy();
    const apr = getRepresentativeApr(address, representatives);

    return apr === undefined ? (
        <Translation id="TR_UNKNOWN" />
    ) : (
        <>{formatApyValue(apr, { withSymbol: true })}</>
    );
};
