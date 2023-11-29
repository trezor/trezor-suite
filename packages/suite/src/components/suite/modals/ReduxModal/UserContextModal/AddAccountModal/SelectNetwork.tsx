import styled from 'styled-components';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Paragraph } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { CoinList } from 'src/components/suite';
import type { Network } from 'src/types/wallet';

const Title = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
    margin-bottom: ${spacingsPx.sm};
`;

type SelectNetworkProps = {
    heading: React.ReactNode;
    networks: Network[];
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
            <Title type="hint">{heading}</Title>
            <CoinList
                onToggle={handleNetworkSelection}
                networks={networks}
                selectedNetworks={selectedNetworks}
            />
        </div>
    );
};
