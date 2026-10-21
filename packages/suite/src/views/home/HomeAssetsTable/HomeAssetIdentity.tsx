import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { Column, Row, TOOLTIP_DELAY_LONG, Text, TruncateWithTooltip } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { TokenUrlBlur } from 'src/components/suite/TokenUrlBlur';

import { HOME_ASSET_LINE_GAP } from './homeAssetTableLayout';

type HomeAssetIdentityProps = {
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    displaySymbol: string | undefined;
    tokenSymbol: TokenSymbol | null | undefined;
};

export const HomeAssetIdentity = ({
    symbol,
    contractAddress,
    displaySymbol,
    tokenSymbol,
}: HomeAssetIdentityProps) => {
    const { NetworkNameFormatter } = useFormatters();

    return (
        <Row gap={12} minWidth={0}>
            <TokenIcon
                symbol={symbol}
                contractAddress={contractAddress}
                size={32}
                showNetworkIcon
                placeholder={displaySymbol ?? ''}
            />
            <Column alignItems="flex-start" gap={HOME_ASSET_LINE_GAP} flex="1" minWidth={0}>
                <Text
                    typographyStyle="body-md"
                    ellipsisLineCount={1}
                    maxWidth="100%"
                    data-testid="@dashboard/home-asset/name"
                >
                    <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                        <TokenUrlBlur text={tokenSymbol ?? displaySymbol} />
                    </TruncateWithTooltip>
                </Text>
                <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <NetworkNameFormatter value={symbol} />
                </Text>
            </Column>
        </Row>
    );
};
