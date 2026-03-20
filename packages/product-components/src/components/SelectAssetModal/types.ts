import type { ReactNode } from 'react';

import type { NetworkSymbolExtended } from '@suite-common/wallet-config';
import type { BaseCurrencyAmount } from '@suite-common/wallet-types';

export type AssetTokenBalance = {
    baseSymbol?: string; // TokenInfo['symbol'];
    baseAmount: string;
    fiatAmount: BaseCurrencyAmount | null;
};

export type AssetProps = {
    ticker: string;
    badge?: ReactNode;
    symbol: NetworkSymbolExtended;
    cryptoName?: string;
    coingeckoId?: string;
    contractAddress: string | null;
    height: number;
    shouldTryToFetch?: boolean;
    tokenBalance?: AssetTokenBalance;
};

export type AssetOptionBaseProps = Omit<AssetProps, 'height' | 'formattedBalance'>;

export type SelectAssetModalProps = {
    options: AssetProps[];
    onSelectAsset: (selectedAsset: AssetOptionBaseProps) => Promise<void> | void;
    onClose: () => void;
    searchInput?: ReactNode;
    filterTabs?: ReactNode;
    noItemsAvailablePlaceholder: { heading: ReactNode; body?: ReactNode };
    'data-testid'?: string;
    renderOptionBalance: (assetProps: AssetProps) => ReactNode;
};
