import { type ReactNode } from 'react';

import { TokenSymbol } from '@suite/token';
import { useFormatters } from '@suite-common/formatters';
import { selectIsSpecificCoinDefinitionKnown } from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Row, TOOLTIP_DELAY_LONG, Text, TruncateWithTooltip } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { useSelector } from '#src/hooks/suite/useSelector';

import { HOME_ASSET_LINE_GAP } from './homeAssetTableLayout';

type HomeAssetIdentityProps = {
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    displaySymbol: string | undefined;
    badge?: ReactNode;
};

export const HomeAssetIdentity = ({
    symbol,
    contractAddress,
    displaySymbol,
    badge,
}: HomeAssetIdentityProps) => {
    const { NetworkNameFormatter } = useFormatters();
    const isIconFetchable = useSelector(
        state =>
            contractAddress === undefined ||
            selectIsSpecificCoinDefinitionKnown(state, symbol, contractAddress),
    );

    return (
        <Row gap={12} minWidth={0}>
            <TokenIcon
                symbol={symbol}
                contractAddress={contractAddress}
                size={32}
                showNetworkIcon
                shouldTryToFetch={isIconFetchable}
                placeholder={displaySymbol ?? ''}
            />
            <Column alignItems="flex-start" gap={HOME_ASSET_LINE_GAP} flex="1" minWidth={0}>
                <Row gap={8} maxWidth="100%">
                    <Text
                        typographyStyle="body-md"
                        ellipsisLineCount={1}
                        minWidth={0}
                        data-testid="@dashboard/home-asset/name"
                    >
                        <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                            {contractAddress ? (
                                <TokenSymbol
                                    networkSymbol={symbol}
                                    tokenContract={contractAddress}
                                />
                            ) : (
                                displaySymbol
                            )}
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
