import { selectTradeServerEnvironment, suiteSettingsActions } from '@suite/settings';
import { injectQueryClient, tradingQueryKeys } from '@suite-common/react-query';
import { type TradeServerEnvironment, tradeApi } from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

export const TradeApi = () => {
    const tradeServerEnvironment = useSelector(selectTradeServerEnvironment);
    const { dispatch, queryClient } = useServices(injectDispatch, injectQueryClient);

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
        /**
         * Marks the catalogs of every server stale, so switching back loads them again,
         * and tells the catalog status hooks to read the catalogs of the new server.
         */
        queryClient.invalidateQueries({
            queryKey: tradingQueryKeys.catalogs(),
            refetchType: 'none',
        });
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
