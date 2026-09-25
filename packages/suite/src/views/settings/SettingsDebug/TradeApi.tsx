import { selectTradeServerEnvironment, suiteSettingsActions } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type TradeServerEnvironment, tradeApi, tradingActions } from '@suite-common/trading';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const TradeApi = () => {
    const tradeServerEnvironment = useSelector(selectTradeServerEnvironment);
    const { dispatch } = useServices(injectDispatch);

    const tradeApiServerOptions = Object.entries(tradeApi.SERVERS).map(([environment, server]) => ({
        label: server,
        value: environment as TradeServerEnvironment,
    }));
    const selectedTradeApiServer =
        tradeApiServerOptions.find(s => s.value === tradeServerEnvironment) ||
        tradeApiServerOptions[0];

    const handleChange = (item: { value: TradeServerEnvironment; label: string }) => {
        dispatch(suiteSettingsActions.setDebugMode({ tradeServerEnvironment: item.value }));
        tradeApi.setServersEnvironment(item.value);
        tradeApi.resetCurrentAccount();
        dispatch(tradingActions.invalidateCatalog());
    };

    return (
        <SectionItem
            title="API server"
            description="Set the server url for buy and exchange features"
            actions={
                <SectionItem.Select
                    onChange={handleChange}
                    value={selectedTradeApiServer}
                    options={tradeApiServerOptions}
                />
            }
        />
    );
};
