import { useCallback, useMemo } from 'react';

import { type OtcProviderType, getOtcProvidersByCountry, useFetchOtc } from '@suite-common/trading';
import { useFormContext, useWatch } from '@suite-native/forms';
import { type ConciergeFormValues } from '@suite-native/trading-types';

export const useConciergeProviders = () => {
    const { data: otcData } = useFetchOtc();

    const { control, setValue } = useFormContext<ConciergeFormValues>();
    const [country, providerUrl] = useWatch({
        control,
        name: ['country', 'providerUrl'],
    });

    const providers = useMemo(
        () => getOtcProvidersByCountry(otcData, country.value),
        [otcData, country.value],
    );

    // @ts-expect-error: noUncheckedIndexedAccess
    const defaultProvider: OtcProviderType = providers?.[0];
    const selectedProvider =
        providers.find(provider => provider.url === providerUrl) ?? defaultProvider;

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
