import { type ComponentType } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    type BannerFlagsSliceRootState,
    EthEarnPromoBanner,
    SolEarnPromoBanner,
    selectIsEarnBannerClosed,
} from '@suite-native/banners';

interface AccountEarnPromoBannerProps {
    account?: Account | null;
}

const earnPromoBanners: Partial<Record<NetworkSymbol, ComponentType<{ account: Account }>>> = {
    [asNetworkSymbol('eth')]: EthEarnPromoBanner,
    [asNetworkSymbol('sol')]: SolEarnPromoBanner,
};

export const AccountEarnPromoBanner = ({ account }: AccountEarnPromoBannerProps) => {
    const symbol = account?.symbol;

    const isClosed = useSelector((state: BannerFlagsSliceRootState) =>
        symbol !== undefined ? selectIsEarnBannerClosed(state, symbol) : false,
    );

    if (isClosed || !account?.symbol) {
        return null;
    }

    const BannerToRender = earnPromoBanners[account.symbol];

    if (BannerToRender) return <BannerToRender account={account} />;

    return null;
};
