import { Translation } from '@suite/intl';
import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import { Button, Column, H4, Row, Text, Tooltip } from '@trezor/components';

import { NetworkList } from 'src/components/suite/NetworkList/NetworkList';

type SelectNetworkProps = {
    heading?: React.ReactNode;
    networks: Network[];
    enabledNetworkSymbols?: NetworkSymbol[];
    accountCounts?: Partial<Record<NetworkSymbol, number>>;
    activatingNetworkSymbols?: NetworkSymbol[];
    activationErrors?: Partial<Record<NetworkSymbol, string>>;
    handleNetworkSelection?: (symbol?: NetworkSymbol) => void;
    onSettings?: (symbol: NetworkSymbol) => void;
    getAddDisabledMessage?: (network: Network) => React.ReactNode;
    dataTestId?: string;
};

export const SelectNetwork = ({
    heading,
    networks,
    enabledNetworkSymbols,
    accountCounts,
    activatingNetworkSymbols = [],
    activationErrors,
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
            {heading !== undefined && (
                <H4 intent="neutral" priority="secondary" typographyStyle="body-sm">
                    {heading}
                </H4>
            )}
            <NetworkList
                onClick={handleNetworkSelection}
                networks={networks}
                enabledNetworks={enabledNetworkSymbols}
                isCardClickable={false}
                onSettings={onSettings}
                getIsSettingsVisible={({ isEnabled, network }) =>
                    !isEnabled && !activatingNetworkSymbols.includes(network.symbol)
                }
                showRepresentativeAssets={false}
                ignoreDiscoveryLock
                renderRightContent={
                    handleNetworkSelection
                        ? ({ network, isEnabled }) => {
                              const disabledMessage = getAddDisabledMessage?.(network);
                              const isLoading = activatingNetworkSymbols.includes(network.symbol);
                              const activationError = activationErrors?.[network.symbol];

                              return (
                                  <Row gap={12}>
                                      {isEnabled && !isLoading && (
                                          <Text
                                              typographyStyle="body-sm"
                                              intent="neutral"
                                              priority="secondary"
                                          >
                                              <Translation
                                                  id="TR_ACCOUNT_COUNT"
                                                  values={{
                                                      count: accountCounts?.[network.symbol] ?? 0,
                                                  }}
                                              />
                                          </Text>
                                      )}
                                      <Tooltip
                                          tooltipMaxWidth={285}
                                          content={
                                              isLoading
                                                  ? undefined
                                                  : (activationError ?? disabledMessage)
                                          }
                                      >
                                          <Button
                                              size="small"
                                              intent="brand"
                                              isLoading={isLoading}
                                              isDisabled={!!disabledMessage || isLoading}
                                              data-testid={`@settings/wallet/network/${network.symbol}/add-button`}
                                              onClick={() => handleNetworkSelection(network.symbol)}
                                          >
                                              <Translation
                                                  id={
                                                      isEnabled && !isLoading
                                                          ? 'TR_ADD'
                                                          : 'TR_ENABLE'
                                                  }
                                              />
                                          </Button>
                                      </Tooltip>
                                  </Row>
                              );
                          }
                        : undefined
                }
            />
        </Column>
    );
};
