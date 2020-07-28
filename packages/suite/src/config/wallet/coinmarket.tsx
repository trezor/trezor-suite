import React from 'react';
import { Translation } from '@suite-components/Translation';

export const MENU_ITEMS = [
    {
        route: 'wallet-coinmarket-buy',
        title: <Translation id="TR_NAV_BUY" />,
    },
    {
        route: 'wallet-coinmarket-exchange',
        title: <Translation id="TR_NAV_EXCHANGE" />,
    },
    {
        route: 'wallet-coinmarket-spend',
        title: <Translation id="TR_NAV_SPEND" />,
    },
] as const;
