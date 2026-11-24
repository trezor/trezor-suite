import { HiddenPlaceholder } from '@suite/discreet-mode';
import { type AssetId, parseAssetId } from '@suite-common/asset-types';
import { useFormatters } from '@suite-common/formatters';
import { useTokenMetadata } from '@suite-common/token';
import { type AmountUnit } from '@suite-common/wallet-utils';

import { AssetSymbol } from './AssetSymbol';

type AssetValueProps = {
    assetId: AssetId;
    amount: AmountUnit;
    isCompact?: boolean;
};

/** An amount of a native token or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetValue = ({ amount, assetId, isCompact = false }: AssetValueProps) => {
    const { networkSymbol, contractAddress } = parseAssetId(assetId);
    const { CryptoAmountFormatter } = useFormatters();
    const token = useTokenMetadata(networkSymbol, contractAddress);
    const formatStyle = isCompact ? 'compact-balance' : 'exact';

    if (!contractAddress) {
        // `isBalance` shows the amount in the unit chosen in the settings, e.g. sats.
        return (
            <HiddenPlaceholder>
                <CryptoAmountFormatter
                    value={amount.toFixed()}
                    symbol={networkSymbol}
                    isBalance
                    formatStyle={formatStyle}
                />
            </HiddenPlaceholder>
        );
    }

    return (
        <HiddenPlaceholder>
            {/* The amount is already in main units, and the symbol is rendered as a component. */}
            <CryptoAmountFormatter
                value={amount.toFixed()}
                smallestUnitsOverride={false}
                withSymbol={false}
                formatStyle={formatStyle}
                tokenDecimals={token?.decimals}
            />{' '}
            <AssetSymbol assetId={assetId} />
        </HiddenPlaceholder>
    );
};
