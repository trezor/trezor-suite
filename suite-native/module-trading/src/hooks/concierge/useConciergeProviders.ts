import { useCallback, useMemo } from 'react';

import { type OtcProviderType, getOtcProvidersByCountry, useFetchOtc } from '@suite-common/trading';
import { useFormContext } from '@suite-native/forms';
import { type ConciergeFormValues } from '@suite-native/trading-types';

export const useConciergeProviders = () => {
    const { data: otcData } = useFetchOtc();

    const { setValue, watch } = useFormContext<ConciergeFormValues>();
    const country = watch('country');
    const providerUrl = watch('providerUrl');

    const providers = useMemo(
        () => getOtcProvidersByCountry(otcData, country.value),
        [otcData, country.value],
    );

    const selectedProvider =
        providers.find(provider => provider.url === providerUrl) ?? providers?.[0];

    const setSelectedProvider = useCallback(
        (provider: OtcProviderType) => {
            setValue('providerUrl', provider.url);
        },
        [setValue],
    );

    return {
        providers,
        selectedProvider,
        setSelectedProvider,
    };
};
