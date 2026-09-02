import { type ComponentType } from 'react';
import { useSelector } from 'react-redux';

import { type Account } from '@suite-common/wallet-types';
import {
    type BannerFlagsSliceRootState,
    EthEarnPromoBanner,
    SolEarnPromoBanner,
    selectIsEarnBannerClosed,
} from '@suite-native/banners';
import { type EarnPromoSymbol } from '@suite-native/module-earn';

interface AccountEarnPromoBannerProps {
    account?: Account | null;
}

const earnPromoBanners: Partial<Record<EarnPromoSymbol, ComponentType<{ account: Account }>>> = {
    eth: EthEarnPromoBanner,
    sol: SolEarnPromoBanner,
};

export const AccountEarnPromoBanner = ({ account }: AccountEarnPromoBannerProps) => {
    const symbol = account?.symbol;

    const isClosed = useSelector((state: BannerFlagsSliceRootState) =>
        symbol !== undefined ? selectIsEarnBannerClosed(state, symbol) : false,
    );

    if (isClosed || !account?.symbol) {
        return null;
    }

    const BannerToRender = earnPromoBanners[account?.symbol];

    if (BannerToRender) return <BannerToRender account={account} />;

    return null;
};
