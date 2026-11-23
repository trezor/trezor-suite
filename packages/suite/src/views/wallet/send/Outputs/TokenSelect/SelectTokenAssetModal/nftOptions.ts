import { type TokenDefinition } from '@suite-common/token-definitions';
import { getTokens } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { hasNetworkFeatures, isNftMatchesSearch } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { ASSET_ROW_HEIGHT } from '#src/components/suite/asset-picker/constants';
import { type AssetPickerListItem } from '#src/components/suite/asset-picker/types';
import { getAssetPickerItemHeight } from '#src/components/suite/asset-picker/utils/assetPickerItemHeights';

// One held item of an NFT collection; kept out of the shared picker options so that the global
// send and trading pickers never offer NFTs.
export type NFTOption = {
    type: 'nft';
    account: Account;
    token: TokenInfo;
    tokenId: string;
};

export type SendTokenPickerItem = AssetPickerListItem | NFTOption;

type BuildNFTOptionsParams = {
    account: Account;
    nftDefinitions: TokenDefinition | undefined;
    isNftSectionEnabled: boolean;
};

const getHeldItemIds = ({ ids, multiTokenValues }: TokenInfo) => [
    ...(ids ?? []),
    ...(multiTokenValues ?? []).flatMap(({ id, value }) =>
        id !== undefined && new BigNumber(value ?? '0').isGreaterThan(0) ? [id] : [],
    ),
];

export const buildNFTOptions = ({
    account,
    nftDefinitions,
    isNftSectionEnabled,
}: BuildNFTOptionsParams): NFTOption[] => {
    if (!isNftSectionEnabled || !hasNetworkFeatures(account, 'nfts')) {
        return [];
    }

    // Hidden and unverified collections stay out: spam NFTs are airdropped unsolicited.
    const { shownWithBalance } = getTokens({
        tokens: account.tokens,
        symbol: account.symbol,
        tokenDefinitions: nftDefinitions,
        isNft: true,
    });

    return shownWithBalance.flatMap(token =>
        getHeldItemIds(token).map(tokenId => ({ type: 'nft' as const, account, token, tokenId })),
    );
};

export const filterNFTOptions = (options: NFTOption[], search: string): NFTOption[] => {
    const query = search.trim().toLowerCase();

    if (!query) {
        return options;
    }

    return options.filter(
        ({ token, tokenId }) => isNftMatchesSearch(token, query) || tokenId.includes(query),
    );
};

export const withNFTGroupLabel = (options: NFTOption[]): SendTokenPickerItem[] =>
    options.length === 0
        ? []
        : [
              { type: 'group-space', size: 'md' },
              { type: 'group-label', label: 'TR_NAV_NFTS' },
              ...options,
          ];

export const getSendTokenPickerItemHeight = (item: SendTokenPickerItem) =>
    item.type === 'nft' ? ASSET_ROW_HEIGHT : getAssetPickerItemHeight(item);
