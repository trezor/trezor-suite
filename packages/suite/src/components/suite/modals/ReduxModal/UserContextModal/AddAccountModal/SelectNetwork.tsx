import { Translation } from '@suite/intl';
import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import { Button, Column, H4, Tooltip } from '@trezor/components';

import { NetworkList } from 'src/components/suite/NetworkList/NetworkList';

type SelectNetworkProps = {
    heading?: React.ReactNode;
    networks: Network[];
    handleNetworkSelection?: (symbol?: NetworkSymbol) => void;
    onSettings?: (symbol: NetworkSymbol) => void;
    getAddDisabledMessage?: (network: Network) => React.ReactNode;
    dataTestId?: string;
};

export const SelectNetwork = ({
    heading,
    networks,
    handleNetworkSelection,
    onSettings,
    getAddDisabledMessage,
    dataTestId,
}: SelectNetworkProps) => {
    if (!networks.length) {
        return null;
    }

    return (
        <Column gap={12} data-testid={dataTestId}>
            {heading && (
                <H4 intent="neutral" priority="secondary" typographyStyle="body-sm">
                    {heading}
                </H4>
            )}
            <NetworkList
                onClick={handleNetworkSelection}
                networks={networks}
                isCardClickable={false}
                onSettings={onSettings}
                renderRightContent={
                    handleNetworkSelection
                        ? ({ network }) => {
                              const disabledMessage = getAddDisabledMessage?.(network);

                              return (
                                  <Tooltip tooltipMaxWidth={285} content={disabledMessage}>
                                      <Button
                                          size="small"
                                          intent="brand"
                                          isDisabled={!!disabledMessage}
                                          data-testid={`@settings/wallet/network/${network.symbol}/add-button`}
                                          onClick={() => handleNetworkSelection(network.symbol)}
                                      >
                                          <Translation id="TR_ADD" />
                                      </Button>
                                  </Tooltip>
                              );
                          }
                        : undefined
                }
            />
        </Column>
    );
};
