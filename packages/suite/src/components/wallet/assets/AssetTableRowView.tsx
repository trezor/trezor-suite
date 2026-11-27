import { type ReactNode } from 'react';

import { AssetItem } from '@suite/assets';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AssetBalance } from '@suite-common/wallet-types';
import {
    Column,
    IconCircle,
    Row,
    TOOLTIP_DELAY_LONG,
    Table,
    Text,
    TruncateWithTooltip,
} from '@trezor/components';
import { PiggyBankFilledIcon } from '@trezor/icons';

import { PriceTicker } from '#src/components/suite/Ticker/PriceTicker';
import { TrendTicker } from '#src/components/suite/Ticker/TrendTicker';

type AssetTableRowViewProps = {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    isStaking?: boolean;
    badge?: ReactNode;
    balance: AssetBalance | null;
    onOpen: () => void;
    hasBorderTop?: boolean;
    assetNameTestId?: string;
    'data-testid': string;
};

export const AssetTableRowView = ({
    networkSymbol,
    contractAddress,
    isStaking,
    badge,
    balance,
    onOpen,
    hasBorderTop,
    assetNameTestId,
    'data-testid': testId,
}: AssetTableRowViewProps) => {
    const { NetworkNameFormatter } = useFormatters();

    return (
        <Table.Row hasBorderTop={hasBorderTop} onClick={onOpen} data-testid={testId}>
            <Table.Cell data-testid={assetNameTestId}>
                {isStaking ? (
                    <Row gap={12} minWidth={0}>
                        <IconCircle icon={PiggyBankFilledIcon} size={32} intent="neutral" />
                        <Column alignItems="flex-start" flex="1" minWidth={0}>
                            <Row gap={8} maxWidth="100%">
                                <Text
                                    typographyStyle="body-md"
                                    ellipsisLineCount={1}
                                    minWidth={0}
                                    data-testid="@dashboard/home-asset/name"
                                >
                                    <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                                        <Translation id="TR_EARN_STAKING" />
                                    </TruncateWithTooltip>
                                </Text>
                                {badge}
                            </Row>
                            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                                <NetworkNameFormatter value={networkSymbol} />
                            </Text>
                        </Column>
                    </Row>
                ) : (
                    <AssetItem.Identity
                        networkSymbol={networkSymbol}
                        contractAddress={contractAddress}
                        showNetworkIcon
                        badge={badge}
                        data-testid="@dashboard/home-asset/name"
                    />
                )}
            </Table.Cell>
            <Table.Cell align="end">
                {!isStaking && (
                    <Column alignItems="flex-end">
                        <PriceTicker symbol={networkSymbol} contractAddress={contractAddress} />
                        <TrendTicker symbol={networkSymbol} contractAddress={contractAddress} />
                    </Column>
                )}
            </Table.Cell>
            <Table.Cell align="end">
                {balance !== null && (
                    <AssetItem.Balance
                        networkSymbol={networkSymbol}
                        contractAddress={contractAddress}
                        balance={balance}
                        maxWidth={180}
                    />
                )}
            </Table.Cell>
        </Table.Row>
    );
};
