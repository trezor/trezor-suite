import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

export const useDefaultUrls = (symbol: NetworkSymbol) =>
    useQuery({
        queryKey: desktopQueryKeys.defaultUrls(symbol),
        queryFn: async () => {
            const result = await TrezorConnect.getCoinInfo({ coin: symbol });

            if (!result.success) {
                throw new Error('Failed to get coin info');
            }

            return result.payload.blockchainLink?.url ?? [];
        },
        initialData: [],
    });
