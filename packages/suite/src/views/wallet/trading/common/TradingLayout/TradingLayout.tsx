import { PropsWithChildren } from 'react';

import { Column } from '@trezor/components';

import { TradingLayoutNavigation } from 'src/views/wallet/trading/common/TradingLayout/TradingLayoutNavigation';

export const TradingLayout = ({ children }: PropsWithChildren) => (
    <Column data-testid="@trading" gap={24}>
        <TradingLayoutNavigation />
        {children}
    </Column>
);
