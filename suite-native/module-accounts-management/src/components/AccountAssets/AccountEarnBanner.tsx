import { useSelector } from 'react-redux';

import { type Account } from '@suite-common/wallet-types';
import {
    type BannerFlagsSliceRootState,
    selectIsEarnBannerClosed,
} from '@suite-native/banner-flags';

import { EthEarnBanner } from './EthEarnBanner';
import { SolEarnBanner } from './SolEarnBanner';

interface AccountEarnBannerProps {
    account?: Account | null;
}

export const AccountEarnBanner = ({ account }: AccountEarnBannerProps) => {
    const symbol = account?.symbol;

    const isClosed = useSelector((state: BannerFlagsSliceRootState) =>
        symbol !== undefined ? selectIsEarnBannerClosed(state, symbol) : false,
    );

    if (isClosed) {
        return null;
    }

    if (account?.symbol === 'eth') {
        return <EthEarnBanner account={account} />;
    }

    if (account?.symbol === 'sol') {
        return <SolEarnBanner account={account} />;
    }

    return null;
};
