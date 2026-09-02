import React from 'react';
import { useSelector } from 'react-redux';

import {
    type EarnYieldWorkerBaseUrl,
    defaultEarnYieldWorkerBaseUrl,
    earnYieldWorkerBaseUrl,
    earnYieldWorkerBaseUrls,
} from '@suite-common/earn-stablecoin-api';
import { useDispatch } from '@suite-common/redux-utils';
import { Select, type SelectItemType } from '@suite-native/atoms';
import { selectEarnYieldWorkerBaseUrl, setEarnWorkerEnvironment } from '@suite-native/settings';

const earnWorkerBaseUrlItems: SelectItemType<EarnYieldWorkerBaseUrl>[] =
    earnYieldWorkerBaseUrls.map(baseUrl => ({
        value: baseUrl,
        label: baseUrl,
    }));

export const EarnEnvironmentSelect = () => {
    const storedValue = useSelector(selectEarnYieldWorkerBaseUrl);
    const dispatch = useDispatch();

    const handleSelectEnvironment = (baseUrl: EarnYieldWorkerBaseUrl) => {
        dispatch(setEarnWorkerEnvironment(baseUrl));
        earnYieldWorkerBaseUrl.set(baseUrl);
    };

    return (
        <Select<EarnYieldWorkerBaseUrl>
            title="Yield worker base URL"
            items={earnWorkerBaseUrlItems}
            value={storedValue ?? defaultEarnYieldWorkerBaseUrl}
            onSelectItem={handleSelectEnvironment}
            isLabelShown
        />
    );
};
