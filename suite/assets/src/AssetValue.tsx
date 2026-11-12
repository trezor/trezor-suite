import { HiddenPlaceholder } from '@suite/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AmountUnit } from '@suite-common/wallet-utils';

import { AssetSymbol } from './AssetSymbol';

type AssetValueProps = {
    amount: AmountUnit;
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    isCompact?: boolean;
};

/** An amount of a native token or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetValue = ({
    amount,
    networkSymbol,
    contractAddress,
    isCompact = false,
}: AssetValueProps) => {
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
            <AssetSymbol networkSymbol={networkSymbol} contractAddress={contractAddress} />
        </HiddenPlaceholder>
    );
};
