import styled from 'styled-components';

import { NetworkCompatible, NetworkSymbol } from '@suite-common/wallet-config';
import { Paragraph } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { CoinList } from 'src/components/suite';

const Title = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
    margin-bottom: ${spacingsPx.sm};
`;

type SelectNetworkProps = {
    heading: React.ReactNode;
    networks: NetworkCompatible[];
    selectedNetworks: NetworkSymbol[];
    handleNetworkSelection: (symbol?: NetworkSymbol) => void;
};

export const SelectNetwork = ({
    heading,
    networks,
    selectedNetworks,
    handleNetworkSelection,
}: SelectNetworkProps) => {
    if (!networks.length) {
        return null;
    }

    return (
        <div>
            <Title typographyStyle="hint">{heading}</Title>
            <CoinList
                onToggle={handleNetworkSelection}
                networks={networks}
                enabledNetworks={selectedNetworks}
            />
        </div>
    );
};
