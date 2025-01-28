import { PropsWithChildren } from 'react';

import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { TradingLayoutNavigation } from 'src/views/wallet/trading/common/TradingLayout/TradingLayoutNavigation';

interface TradingLayoutProps extends PropsWithChildren {}

export const TradingLayout = ({ children }: TradingLayoutProps) => {
    const routeName = useSelector(selectRouteName);

    return (
        <Column data-testid="@trading" gap={spacings.xl}>
            {!routeName?.includes(`wallet-trading-exchange`) && (
                <TradingLayoutNavigation route={routeName} />
            )}
            {children}
        </Column>
    );
};
