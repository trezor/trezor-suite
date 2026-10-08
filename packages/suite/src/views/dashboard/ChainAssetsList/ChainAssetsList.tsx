import { useState } from 'react';

import { Translation } from '@suite/intl';
import { type ChainAsset } from '@suite-common/chain-data';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectAccounts, selectBaseCurrency } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Badge, Button, Card, Column, Divider, Row, Text } from '@trezor/components';
import type { RuntimeEvmNetworkDefinition } from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import { DashboardSection } from 'src/components/dashboard';
import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';
import { AccountLabeling } from 'src/components/suite/labeling/AccountLabeling';
import { useSelector } from 'src/hooks/suite';
import { useDashboardChainAssets } from 'src/hooks/wallet/chainData/useDashboardChainAssets';
import { useSendOnRuntimeNetwork } from 'src/hooks/wallet/chainSend/useSendOnRuntimeNetwork';
import { type RuntimeChainSendComposed } from 'src/support/runtimeEvmNetworks/runtimeChainSend';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

import { RuntimeChainSendModal } from './RuntimeChainSendModal';
import { type AssetTotal } from './groupChainAssetsByNetwork';

type AssetRowProps = {
    networkSymbol: NetworkSymbol;
    asset: AssetTotal;
};

const AssetRow = ({ networkSymbol, asset }: AssetRowProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const currency = useSelector(selectBaseCurrency);

    return (
        <Row justifyContent="space-between" gap={16}>
            <Text typographyStyle="body-md">
                <FormattedCryptoAmount
                    value={asset.amount}
                    symbol={asset.contract ? asset.symbol?.toLowerCase() : networkSymbol}
                    contractAddress={asset.contract}
                    tokenDecimals={asset.decimals}
                />
            </Text>
            {asset.fiatValue !== null && (
                <HiddenPlaceholder>
                    <BaseCurrencyAmountFormatter
                        value={asBaseCurrencyAmount(new BigNumber(asset.fiatValue))}
                        currency={currency}
                    />
                </HiddenPlaceholder>
            )}
        </Row>
    );
};

type RuntimeAccountRowProps = {
    asset: ChainAsset;
    definition: RuntimeEvmNetworkDefinition;
};

const RuntimeAccountRow = ({ asset, definition }: RuntimeAccountRowProps) => {
    // A runtime network's chain account belongs to the wallet account whose address it uses.
    const walletAccount = useSelector(state =>
        selectAccounts(state).find(account => account.key === asset.accountId),
    );
    const sendOnRuntimeNetwork = useSendOnRuntimeNetwork();
    const [isComposing, setIsComposing] = useState(false);

    // The composing modal closes before signing: the device's prompts open their own modal.
    const handleComposed = (composed: RuntimeChainSendComposed) => {
        setIsComposing(false);
        if (!walletAccount) return;
        sendOnRuntimeNetwork({ definition, walletAccount, balance: asset.amount, composed });
    };

    return (
        <Row justifyContent="space-between" gap={16}>
            {isComposing && walletAccount && (
                <RuntimeChainSendModal
                    definition={definition}
                    walletAccount={walletAccount}
                    onComposed={handleComposed}
                    onCancel={() => setIsComposing(false)}
                />
            )}
            {walletAccount && <AccountLabeling account={walletAccount} />}
            <Row gap={12}>
                <Text typographyStyle="body-md">
                    <FormattedCryptoAmount
                        value={asset.amount}
                        tokenDecimals={definition.decimals}
                    />{' '}
                    <BlurUrls text={definition.nativeSymbol} />
                </Text>
                <Button
                    size="small"
                    intent="neutral"
                    priority="secondary"
                    isDisabled={!walletAccount || new BigNumber(asset.amount).lte(0)}
                    onClick={() => setIsComposing(true)}
                    data-testid={`@dashboard/runtime-send/${definition.symbol}`}
                >
                    Send
                </Button>
            </Row>
        </Row>
    );
};

type RuntimeNetworkGroupProps = {
    definition: RuntimeEvmNetworkDefinition;
    accountAssets: readonly ChainAsset[];
};

const RUNTIME_SOURCE_LABEL: Record<RuntimeEvmNetworkDefinition['source'], string> = {
    trezor: 'Trezor-listed',
    user: 'Added by you',
};

/**
 * A runtime EVM network is not in the app's config: its name, coin and decimals come from its
 * definition, and the coin's symbol never resolves to a built-in network's formatting. It is
 * shown per account, since a send starts from one.
 */
const RuntimeNetworkGroup = ({ definition, accountAssets }: RuntimeNetworkGroupProps) => (
    <>
        <Row gap={8}>
            <Text typographyStyle="body-md-strong">
                <BlurUrls text={definition.name} />
            </Text>
            <Badge size="small">{RUNTIME_SOURCE_LABEL[definition.source]}</Badge>
        </Row>
        {accountAssets.map(asset => (
            <RuntimeAccountRow key={asset.accountId} asset={asset} definition={definition} />
        ))}
    </>
);

/**
 * Debug view of the `queryChainData` flag: every listed account's assets read through chain
 * networks, grouped per network as the dashboard does today.
 */
export const ChainAssetsList = () => {
    const { isEnabled, groups, runtimeNetworks, runtimeAccountAssets } = useDashboardChainAssets();

    if (!isEnabled) return null;

    return (
        <DashboardSection heading={<Translation id="TR_MY_ASSETS" />}>
            <Card data-testid="@dashboard/chain-assets">
                <Column gap={12}>
                    {groups.map((group, index) => {
                        const runtimeNetwork = runtimeNetworks.get(group.symbol);

                        return (
                            <Column key={group.symbol} gap={8}>
                                {index > 0 && <Divider />}
                                {runtimeNetwork ? (
                                    <RuntimeNetworkGroup
                                        definition={runtimeNetwork}
                                        accountAssets={runtimeAccountAssets.get(group.symbol) ?? []}
                                    />
                                ) : (
                                    <>
                                        <Text typographyStyle="body-md-strong">
                                            {getNetwork(group.symbol).name}
                                        </Text>
                                        {group.native && (
                                            <AssetRow
                                                networkSymbol={group.symbol}
                                                asset={group.native}
                                            />
                                        )}
                                        {group.tokens.map(token => (
                                            <AssetRow
                                                key={token.contract}
                                                networkSymbol={group.symbol}
                                                asset={token}
                                            />
                                        ))}
                                    </>
                                )}
                            </Column>
                        );
                    })}
                </Column>
            </Card>
        </DashboardSection>
    );
};
