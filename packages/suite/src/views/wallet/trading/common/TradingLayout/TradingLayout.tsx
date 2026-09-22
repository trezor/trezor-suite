import { type PropsWithChildren } from 'react';

import { selectRouteName } from '@suite/router';
import { Column, Row } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { TradingLayoutNavigation } from 'src/views/wallet/trading/common/TradingLayout/TradingLayoutNavigation';
import { useTradingPageHeader } from 'src/views/wallet/trading/common/TradingLayout/useTradingPageHeader';

export const TradingLayout = ({ children }: PropsWithChildren) => {
    const routeName = useSelector(selectRouteName);

    useTradingPageHeader();

    return (
        <Column data-testid="@trading" gap={24}>
            <Row justifyContent="center">
                <TradingLayoutNavigation route={routeName} />
            </Row>
            {children}
        </Column>
    );
};
