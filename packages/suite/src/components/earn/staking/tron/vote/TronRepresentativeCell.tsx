import { type TrxStats } from '@suite-common/earn-staking-api';
import { Column, Text } from '@trezor/components';

import { getRepresentativeName } from '../utils/voteUtils';

interface TronRepresentativeCellProps {
    address: string;
    representatives: TrxStats | undefined;
    isAddressShown?: boolean;
}

export const TronRepresentativeCell = ({
    address,
    representatives,
    isAddressShown = false,
}: TronRepresentativeCellProps) => {
    const name = getRepresentativeName(address, representatives);

    return (
        <Column gap={2} alignItems="flex-start">
            <Text typographyStyle="body-md">{name ?? address}</Text>
            {name !== undefined && isAddressShown && (
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {address}
                </Text>
            )}
        </Column>
    );
};
