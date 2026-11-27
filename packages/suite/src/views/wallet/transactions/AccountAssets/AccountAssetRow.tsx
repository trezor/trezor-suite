import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AssetBalance } from '@suite-common/wallet-types';

import { AssetApyBadge } from '#src/components/wallet/assets/AssetApyBadge';
import { AssetTableRowView } from '#src/components/wallet/assets/AssetTableRowView';
import { useOpenAsset } from '#src/components/wallet/assets/useOpenAsset';

type AccountAssetRowProps = {
    networkSymbol: NetworkSymbol;
    /** Left out for the account's coin. */
    contractAddress?: TokenAddress;
    tokenSymbol?: TokenSymbol;
    tokenDecimals?: number;
    balance: AssetBalance | null;
};

/** A Home asset row with what one account holds of its coin or of a token; it opens the asset. */
export const AccountAssetRow = ({
    networkSymbol,
    contractAddress,
    tokenSymbol,
    tokenDecimals,
    balance,
}: AccountAssetRowProps) => {
    const openAsset = useOpenAsset({ from: 'account-overview' });

    return (
        <AssetTableRowView
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            badge={
                <AssetApyBadge
                    symbol={networkSymbol}
                    contractAddress={contractAddress}
                    tokenSymbol={tokenSymbol ?? null}
                    tokenDecimals={tokenDecimals}
                />
            }
            balance={balance}
            onOpen={() => openAsset({ networkSymbol, contractAddress })}
            data-testid={`@wallet/account-asset/${networkSymbol}/${contractAddress ?? 'coin'}`}
        />
    );
};
