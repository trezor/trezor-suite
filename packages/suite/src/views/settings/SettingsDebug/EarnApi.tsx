import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { selectEarnYieldWorkerBaseUrl, suiteSettingsActions } from '@suite/settings';
import {
    type EarnYieldWorkerBaseUrl,
    earnYieldWorkerBaseUrl,
    earnYieldWorkerBaseUrls,
} from '@suite-common/earn-stablecoin-api';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const EarnApi = () => {
    const dispatch = useDispatch();
    const storedValue = useSelector(selectEarnYieldWorkerBaseUrl);
    const options = useMemo(
        () =>
            earnYieldWorkerBaseUrls.map(baseUrl => ({
                label: baseUrl,
                value: baseUrl,
            })),
        [],
    );

    const selectedValue = options.find(option => option.value === storedValue);

    const handleChange = (item: { value: EarnYieldWorkerBaseUrl; label: string }) => {
        dispatch(suiteSettingsActions.setDebugMode({ earnYieldWorkerBaseUrl: item.value }));
        earnYieldWorkerBaseUrl.set(item.value);

        // We need somehow to invalidate current Yield API state so it re-fetches with the new base URL.
        // Since this is debug setting, the easiest way is to just reload the app.
        globalThis.location.reload();
    };

    return (
        <SectionItem>
            <TextColumn
                title="Yield worker base URL"
                description="Set the base url for the earn yield worker"
            />
            <ActionColumn>
                <ActionSelect onChange={handleChange} value={selectedValue} options={options} />
            </ActionColumn>
        </SectionItem>
    );
};
