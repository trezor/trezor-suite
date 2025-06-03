export const shouldFetchCountryCode = (routeName: string | undefined) => {
    if (!routeName) return false;

    const isTradingRoute = routeName.includes('wallet-trading');
    const isStakingRoute = routeName.includes('staking');

    return isTradingRoute || isStakingRoute;
};
