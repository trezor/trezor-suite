import { useSelector } from 'react-redux';

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

export const AccountEarnPromoBanner = ({ account }: AccountEarnPromoBannerProps) => {
    const symbol = account?.symbol;

    const isClosed = useSelector((state: BannerFlagsSliceRootState) =>
        symbol !== undefined ? selectIsEarnBannerClosed(state, symbol) : false,
    );

    if (isClosed) {
        return null;
    }

    if (account?.symbol === 'eth') {
        return <EthEarnPromoBanner account={account} />;
    }

    if (account?.symbol === 'sol') {
        return <SolEarnPromoBanner account={account} />;
    }

    return null;
};
