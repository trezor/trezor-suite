import { PropsWithChildren } from 'react';

import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { TradingLayoutNavigation } from 'src/views/wallet/trading/common/TradingLayout/TradingLayoutNavigation';

export const TradingLayout = ({ children }: PropsWithChildren) => {
    const routeName = useSelector(selectRouteName);

    return (
        <Column data-testid="@trading" gap={24}>
            <TradingLayoutNavigation route={routeName} />
            {children}
        </Column>
    );
};
