import { type Route } from '@suite/router';

const restrictedWatchOnlyAccountRoutes: Route['name'][] = [
    'wallet-send',
    'wallet-receive',
    'wallet-sign-verify',
    'wallet-staking',
    'wallet-trading-buy',
    'wallet-trading-sell',
    'wallet-trading-exchange',
    'wallet-trading-concierge',
    'wallet-trading-buy-detail',
    'wallet-trading-sell-detail',
    'wallet-trading-exchange-detail',
    'wallet-trading-buy-confirm',
    'wallet-trading-sell-confirm',
    'wallet-trading-exchange-confirm',
    'wallet-trading-redirect',
    'wallet-anonymize',
];

export const isWatchOnlyAccountRouteRestricted = (routeName: Route['name'] | undefined): boolean =>
    routeName !== undefined && restrictedWatchOnlyAccountRoutes.includes(routeName);
