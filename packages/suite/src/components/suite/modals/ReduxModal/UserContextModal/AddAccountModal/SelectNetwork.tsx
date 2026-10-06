import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import { Button, Column, Row, Text, Tooltip } from '@trezor/components';

import { NetworkList } from 'src/components/suite/NetworkList/NetworkList';

type SelectNetworkProps = {
    networks: Network[];
    enabledNetworkSymbols: NetworkSymbol[];
    accountCounts: Partial<Record<NetworkSymbol, number>>;
    addingAccountNetworkSymbol: NetworkSymbol | undefined;
    handleNetworkSelection: (symbol?: NetworkSymbol) => void;
    onSettings: (symbol: NetworkSymbol) => void;
    getAddDisabledMessage: (network: Network) => ReactNode;
    activatingNetworkSymbols?: NetworkSymbol[];
    activationErrors?: Partial<Record<NetworkSymbol, string>>;
};

export const SelectNetwork = ({
    networks,
    enabledNetworkSymbols,
    accountCounts,
    activatingNetworkSymbols = [],
    addingAccountNetworkSymbol,
    activationErrors,
    handleNetworkSelection,
    onSettings,
    getAddDisabledMessage,
}: SelectNetworkProps) => {
    if (!networks.length) {
        return null;
    }

    return (
        <Column gap={12}>
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
                renderRightContent={({ network, isEnabled }) => {
                    const disabledMessage = getAddDisabledMessage(network);
                    const isActivating = activatingNetworkSymbols.includes(network.symbol);
                    const isAdding = addingAccountNetworkSymbol === network.symbol;
                    const isLoading = isActivating || isAdding;
                    const activationError = activationErrors?.[network.symbol];
                    const currentAccountCount = accountCounts[network.symbol] ?? 0;

                    return (
                        <Row gap={12}>
                            {isEnabled && !isActivating && (
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation
                                        id="TR_ACCOUNT_COUNT"
                                        values={{ count: currentAccountCount }}
                                    />
                                </Text>
                            )}
                            <Tooltip
                                tooltipMaxWidth={285}
                                content={
                                    isLoading ? undefined : (activationError ?? disabledMessage)
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
                                        id={isActivating || !isEnabled ? 'TR_ENABLE' : 'TR_ADD'}
                                    />
                                </Button>
                            </Tooltip>
                        </Row>
                    );
                }}
            />
        </Column>
    );
};
