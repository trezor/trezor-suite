import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { setTransactionHistoryPrefill } from '#src/actions/suite/suiteActions';
import { AssetTableRowView } from '#src/components/wallet/assets/AssetTableRowView';
import { useOpenAsset } from '#src/components/wallet/assets/useOpenAsset';

type AccountAssetRowProps = {
    networkSymbol: NetworkSymbol;
    /** Left out for the account's coin. */
    contractAddress?: TokenAddress;
    tokenSymbol?: TokenSymbol;
    tokenDecimals?: number;
    amount: string | undefined;
    /**
     * The asset detail lists only what the wallet holds, so a token held at zero opens its
     * transactions in this account instead, in the list below the overview.
     */
    isZeroBalance?: boolean;
};

/** A Home asset row with what one account holds of its coin or of a token; it opens the asset. */
export const AccountAssetRow = ({
    networkSymbol,
    contractAddress,
    tokenSymbol,
    tokenDecimals,
    amount,
    isZeroBalance = false,
}: AccountAssetRowProps) => {
    const { dispatch } = useServices(injectDispatch);
    const openAsset = useOpenAsset({ from: 'account-overview' });

    const open = () => {
        if (isZeroBalance && contractAddress !== undefined) {
            dispatch(setTransactionHistoryPrefill(contractAddress));

            return;
        }

        openAsset({ networkSymbol, contractAddress });
    };

    return (
        <AssetTableRowView
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            tokenSymbol={tokenSymbol ?? null}
            tokenDecimals={tokenDecimals}
            amount={amount}
            onOpen={open}
            data-testid={`@wallet/account-asset/${networkSymbol}/${contractAddress ?? 'coin'}`}
        />
    );
};
