import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, toTokenAddress } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils';

type FetchErc4626UnderlyingAssetParams = {
    coin: NetworkSymbol;
    contract: TokenAddress;
};

export type Erc4626UnderlyingAsset = {
    contract: TokenAddress;
    // Underlying asset units per 1 whole vault share, adjusted for the asset decimals.
    exchangeRate: BigNumber;
};

export const fetchErc4626UnderlyingAsset = async ({
    coin,
    contract,
}: FetchErc4626UnderlyingAssetParams): Promise<Erc4626UnderlyingAsset> => {
    const response = await TrezorConnect.blockchainGetContractInfo({
        coin: asCoinSymbol(coin),
        contract,
        protocols: ['erc4626'],
    });

    if (!response.success) {
        throw new Error(`Error fetching ERC4626 token info for ${contract}`);
    }

    const erc4626 = response.payload.protocols?.erc4626;

    if (!erc4626) {
        throw new Error(`ERC4626 token ${contract} is missing ERC4626 data`);
    }

    if (!erc4626.asset) {
        throw new Error(`ERC4626 token ${contract} is missing underlying asset data`);
    }

    // convertToAssets1Share is raw underlying asset units per 1 whole vault share
    if (!erc4626.convertToAssets1Share) {
        throw new Error(`ERC4626 token ${contract} is missing convertToAssets1Share`);
    }

    return {
        contract: toTokenAddress(erc4626.asset.contract),
        exchangeRate: new BigNumber(erc4626.convertToAssets1Share).shiftedBy(
            -erc4626.asset.decimals,
        ),
    };
};
