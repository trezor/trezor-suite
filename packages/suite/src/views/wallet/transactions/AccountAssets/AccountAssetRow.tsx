import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { AssetTableRowView } from '#src/components/wallet/assets/AssetTableRowView';
import { useOpenAsset } from '#src/components/wallet/assets/useOpenAsset';

type AccountAssetRowProps = {
    networkSymbol: NetworkSymbol;
    /** Left out for the account's coin. */
    contractAddress?: TokenAddress;
    tokenSymbol?: TokenSymbol;
    tokenDecimals?: number;
    amount: string | undefined;
};

/** A Home asset row with what one account holds of its coin or of a token; it opens the asset. */
export const AccountAssetRow = ({
    networkSymbol,
    contractAddress,
    tokenSymbol,
    tokenDecimals,
    amount,
}: AccountAssetRowProps) => {
    const openAsset = useOpenAsset({ from: 'account-overview' });

    return (
        <AssetTableRowView
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            tokenSymbol={tokenSymbol ?? null}
            tokenDecimals={tokenDecimals}
            amount={amount}
            onOpen={() => openAsset({ networkSymbol, contractAddress })}
            data-testid={`@wallet/account-asset/${networkSymbol}/${contractAddress ?? 'coin'}`}
        />
    );
};
