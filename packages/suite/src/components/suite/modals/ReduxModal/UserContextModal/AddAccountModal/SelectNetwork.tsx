import { Network, NetworkSymbol } from '@suite-common/wallet-config';
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
            <Paragraph variant="tertiary" margin={{ bottom: 12 }} typographyStyle="hint">
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
