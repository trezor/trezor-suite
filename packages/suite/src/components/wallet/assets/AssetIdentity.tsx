import { type ReactNode } from 'react';

import { ASSET_TABLE_LINE_GAP, AssetIcon, AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { selectIsSpecificCoinDefinitionKnown } from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    Column,
    IconCircle,
    Row,
    TOOLTIP_DELAY_LONG,
    Text,
    TruncateWithTooltip,
} from '@trezor/components';
import { PiggyBankFilledIcon } from '@trezor/icons';

import { useSelector } from '#src/hooks/suite/useSelector';

/** What a row of an asset table stands for: the asset itself, or a stake of the coin. */
type AssetRowVariant = 'asset' | 'staking';

type AssetIdentityProps = {
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    badge?: ReactNode;
    /** A stake is drawn with a piggy bank and named Staking, as the mobile staking row is. */
    variant?: AssetRowVariant;
};

export const AssetIdentity = ({
    symbol,
    contractAddress,
    badge,
    variant = 'asset',
}: AssetIdentityProps) => {
    const { NetworkNameFormatter } = useFormatters();
    const isIconFetchable = useSelector(
        state =>
            contractAddress === undefined ||
            selectIsSpecificCoinDefinitionKnown(state, symbol, contractAddress),
    );

    return (
        <Row gap={12} minWidth={0}>
            {variant === 'staking' ? (
                <IconCircle icon={PiggyBankFilledIcon} size={32} intent="neutral" />
            ) : (
                <AssetIcon
                    networkSymbol={symbol}
                    contractAddress={contractAddress}
                    size={32}
                    showNetworkIcon
                    shouldTryToFetch={isIconFetchable}
                />
            )}
            <Column alignItems="flex-start" gap={ASSET_TABLE_LINE_GAP} flex="1" minWidth={0}>
                <Row gap={8} maxWidth="100%">
                    <Text
                        typographyStyle="body-md"
                        ellipsisLineCount={1}
                        minWidth={0}
                        data-testid="@dashboard/home-asset/name"
                    >
                        <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                            {variant === 'staking' ? (
                                <Translation id="TR_EARN_STAKING" />
                            ) : (
                                <AssetSymbol
                                    networkSymbol={symbol}
                                    contractAddress={contractAddress}
                                />
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
