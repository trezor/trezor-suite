import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { TrezorBlockchain } from '@trezor/blockchain-core';

export const useDefaultUrls = (symbol: NetworkSymbol) =>
    useQuery({
        queryKey: desktopQueryKeys.defaultUrls(symbol),
        queryFn: async () => {
            const result = await TrezorBlockchain.getDefaultBackend({ coin: symbol });

            if (!result.success) {
                throw new Error('Failed to get the default backend');
            }

            return result.payload?.url ?? [];
        },
        initialData: [],
    });
