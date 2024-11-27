import { PropsWithChildren } from 'react';

import { spacings } from '@trezor/theme';
import { Column } from '@trezor/components';

import { CoinmarketLayoutNavigation } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayoutNavigation/CoinmarketLayoutNavigation';
import { useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

interface CoinmarketLayoutProps extends PropsWithChildren {}

export const CoinmarketLayout = ({ children }: CoinmarketLayoutProps) => {
    const routeName = useSelector(selectRouteName);

    return (
        <Column gap={spacings.xl}>
            {!routeName?.includes(`wallet-coinmarket-exchange`) && <CoinmarketLayoutNavigation />}
            {children}
        </Column>
    );
};
