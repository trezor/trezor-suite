import { Translation } from '@suite/intl';
import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import { Button, Column, H4 } from '@trezor/components';

import { NetworkList } from 'src/components/suite/NetworkList/NetworkList';

type SelectNetworkProps = {
    heading: React.ReactNode;
    networks: Network[];
    handleNetworkSelection?: (symbol?: NetworkSymbol) => void;
    onSettings?: (symbol: NetworkSymbol) => void;
    dataTestId?: string;
};

export const SelectNetwork = ({
    heading,
    networks,
    handleNetworkSelection,
    onSettings,
    dataTestId,
}: SelectNetworkProps) => {
    if (!networks.length) {
        return null;
    }

    return (
        <Column gap={12} data-testid={dataTestId}>
            <H4 intent="neutral" priority="secondary" typographyStyle="body-sm">
                {heading}
            </H4>
            <NetworkList
                onClick={handleNetworkSelection}
                networks={networks}
                isCardClickable={false}
                onSettings={onSettings}
                renderRightContent={
                    handleNetworkSelection
                        ? ({ network }) => (
                              <Button
                                  size="small"
                                  intent="brand"
                                  data-testid={`@settings/wallet/network/${network.symbol}/add-button`}
                                  onClick={() => handleNetworkSelection(network.symbol)}
                              >
                                  <Translation id="TR_ADD" />
                              </Button>
                          )
                        : undefined
                }
            />
        </Column>
    );
};
