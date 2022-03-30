import { useSelector } from '@suite-hooks';
import type { Network } from '@wallet-types';
import type { BackendSettings } from '@wallet-reducers/settingsReducer';

export const useCustomBackends = (): BackendSettings[] => {
    const { backends } = useSelector(state => ({
        backends: state.wallet.settings.backends,
    }));

    return (
        Object.entries(backends) as Array<
            [Network['symbol'], NonNullable<typeof backends[Network['symbol']]>]
        >
    ).map(([coin, settings]) => ({ coin, ...settings }));
};
