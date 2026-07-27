import { type TranslationKey } from '@suite/intl';
import { type Route } from '@suite/router';
import { type TradingType } from '@suite-common/trading';

type TradingRoute = Route['name'];

const TRANSACTIONS_ROUTE: TradingRoute = 'wallet-trading-transactions';

type TradingSection = {
    form: TradingRoute;
    detail: TradingRoute;
    confirm: TradingRoute;
};

const tradingSections = {
    buy: {
        form: 'wallet-trading-buy',
        detail: 'wallet-trading-buy-detail',
        confirm: 'wallet-trading-buy-confirm',
    },
    sell: {
        form: 'wallet-trading-sell',
        detail: 'wallet-trading-sell-detail',
        confirm: 'wallet-trading-sell-confirm',
    },
    exchange: {
        form: 'wallet-trading-exchange',
        detail: 'wallet-trading-exchange-detail',
        confirm: 'wallet-trading-exchange-confirm',
    },
} as const satisfies Record<TradingType, TradingSection>;

const sections = Object.values(tradingSections);
const topLevelRoutes: TradingRoute[] = [...sections.map(s => s.form), 'wallet-trading-concierge'];
const detailRoutes: TradingRoute[] = sections.map(s => s.detail);

const isDetailRoute = (route?: TradingRoute): boolean =>
    route !== undefined && detailRoutes.includes(route);

export const isTradingTopLevelRoute = (route?: TradingRoute): route is TradingRoute =>
    route !== undefined && topLevelRoutes.includes(route);

const getSectionFormRoute = (route?: TradingRoute): TradingRoute =>
    sections.find(s => s.detail === route || s.confirm === route)?.form ?? 'suite-index';

export const getBackRoute = (
    route?: TradingRoute,
    previousRoute?: TradingRoute,
    activeSection: TradingType = 'buy',
): TradingRoute => {
    if (route === TRANSACTIONS_ROUTE) {
        return isTradingTopLevelRoute(previousRoute)
            ? previousRoute
            : tradingSections[activeSection].form;
    }

    if (isDetailRoute(route)) {
        return previousRoute === TRANSACTIONS_ROUTE
            ? TRANSACTIONS_ROUTE
            : getSectionFormRoute(route);
    }

    return getSectionFormRoute(route);
};

export const getTradingHeaderTitle = (route?: TradingRoute): TranslationKey => {
    if (isDetailRoute(route)) {
        return 'TR_TRADING_TRADE_DETAIL';
    }

    if (route === TRANSACTIONS_ROUTE) {
        return 'TR_TRADING_LAST_TRANSACTIONS';
    }

    return 'TR_NAV_TRADE';
};
