import type { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { BaseCurrencyAmount } from '@suite-common/wallet-types';

export interface AssetTokenBalance {
    baseSymbol?: string; // TokenInfo['symbol'];
    baseAmount: string;
    fiatAmount: BaseCurrencyAmount | null;
}

export interface AssetProps {
    ticker: string;
    badge?: React.ReactNode;
    symbol: NetworkSymbolExtended;
    cryptoName?: string;
    coingeckoId?: string;
    contractAddress: string | null;
    height: number;
    shouldTryToFetch?: boolean;
    tokenBalance?: AssetTokenBalance;
}

export type AssetOptionBaseProps = Omit<AssetProps, 'height' | 'formattedBalance'>;
