import { selectTradeServerEnvironment, suiteSettingsActions } from '@suite/settings';
import { type TradeServerEnvironment, tradeApi, tradingActions } from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

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
        <SectionItem>
            <TextColumn
                title="API server"
                description="Set the server url for buy and exchange features"
            />
            <ActionColumn>
                <ActionSelect
                    onChange={handleChange}
                    value={selectedTradeApiServer}
                    options={tradeApiServerOptions}
                />
            </ActionColumn>
        </SectionItem>
    );
};
