import { events, injectDesktopAnalytics } from '@suite/analytics';
import { type Route, gotoThunk } from '@suite/router';
import { type TradingType } from '@suite-common/trading';
import { Box } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { getTradingFormRoute } from 'src/views/wallet/trading/common/TradingLayout/tradingPageHeaderUtils';
import { TradingTypeTabs } from 'src/views/wallet/trading/common/TradingTypeTabs/TradingTypeTabs';

type TradingLayoutNavigationProps = {
    route?: Route['name'];
};

const tradingTypeByFormRoute: Partial<Record<Route['name'], TradingType>> = {
    'wallet-trading-exchange': 'exchange',
    'wallet-trading-buy': 'buy',
    'wallet-trading-sell': 'sell',
};

export const TradingLayoutNavigation = ({ route }: TradingLayoutNavigationProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const goToTradingForm = (type: TradingType) => {
        dispatch(gotoThunk({ routeName: getTradingFormRoute(type) }));
        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: { action: 'navigate', type, from: 'buy/sell' },
        });
    };

    return (
        <Box width="100%" maxWidth={400} margin={{ horizontal: 'auto' }}>
            <Box padding={{ vertical: 4 }}>
                <TradingTypeTabs
                    activeType={route && tradingTypeByFormRoute[route]}
                    size="large"
                    onTypeChange={goToTradingForm}
                />
            </Box>
        </Box>
    );
};
