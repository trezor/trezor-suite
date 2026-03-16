import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import { Paragraph } from '@trezor/components';

import { CoinList } from 'src/components/suite/CoinList/CoinList';

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
            <Paragraph
                intent="neutral"
                priority="secondary"
                margin={{ bottom: 12 }}
                typographyStyle="body-sm"
            >
                {heading}
            </Paragraph>
            <CoinList
                onToggle={handleNetworkSelection}
                networks={networks}
                enabledNetworks={selectedNetworks}
            />
        </div>
    );
};
