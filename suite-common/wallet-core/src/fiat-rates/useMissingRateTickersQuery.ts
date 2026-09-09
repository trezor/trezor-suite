import { useServices } from '@suite-common/dependency-injection';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import { selectDispatch } from '@suite-common/redux-utils';
import { type TickerId, type Timestamp } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { updateFiatRatesThunk } from './fiatRatesThunks';

type UseMissingRateTickersQueryProps = {
    missingRateTickers: TickerId[];
    baseCurrencyCode: BaseCurrencyCode;
};

export const useMissingRateTickersQuery = ({
    missingRateTickers,
    baseCurrencyCode,
}: UseMissingRateTickersQueryProps) => {
    const { dispatch } = useServices(selectDispatch);

    return useQuery({
        queryKey: commonQueryKeys.missingRateTickers(missingRateTickers, baseCurrencyCode),
        queryFn: () =>
            dispatch(
                updateFiatRatesThunk({
                    tickers: missingRateTickers,
                    baseCurrencyCode,
                    rateType: 'current',
                    fetchAttemptTimestamp: Date.now() as Timestamp,
                    forceFetchToken: true,
                }),
            ).unwrap(),
        enabled: missingRateTickers.length > 0,
    });
};
