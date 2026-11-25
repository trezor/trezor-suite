import { type ReactNode } from 'react';

import { ASSET_TABLE_LINE_GAP, AssetIcon, AssetSymbol } from '@suite/assets';
import { useFormatters } from '@suite-common/formatters';
import { selectIsSpecificCoinDefinitionKnown } from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Row, TOOLTIP_DELAY_LONG, Text, TruncateWithTooltip } from '@trezor/components';

import { useSelector } from '#src/hooks/suite/useSelector';

type AssetIdentityProps = {
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    badge?: ReactNode;
};

export const AssetIdentity = ({ symbol, contractAddress, badge }: AssetIdentityProps) => {
    const { NetworkNameFormatter } = useFormatters();
    const isIconFetchable = useSelector(
        state =>
            contractAddress === undefined ||
            selectIsSpecificCoinDefinitionKnown(state, symbol, contractAddress),
    );

    return (
        <Row gap={12} minWidth={0}>
            <AssetIcon
                networkSymbol={symbol}
                contractAddress={contractAddress}
                size={32}
                showNetworkIcon
                shouldTryToFetch={isIconFetchable}
            />
            <Column alignItems="flex-start" gap={ASSET_TABLE_LINE_GAP} flex="1" minWidth={0}>
                <Row gap={8} maxWidth="100%">
                    <Text
                        typographyStyle="body-md"
                        ellipsisLineCount={1}
                        minWidth={0}
                        data-testid="@dashboard/home-asset/name"
                    >
                        <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                            <AssetSymbol networkSymbol={symbol} contractAddress={contractAddress} />
                        </TruncateWithTooltip>
                    </Text>
                    {badge}
                </Row>
                <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <NetworkNameFormatter value={symbol} />
                </Text>
            </Column>
        </Row>
    );
};
