import { selectEarnStakingWorkerBaseUrl, suiteSettingsActions } from '@suite/settings';
import {
    type EarnStakingWorkerBaseUrl,
    earnStakingWorkerBaseUrl,
    earnStakingWorkerBaseUrls,
} from '@suite-common/earn-staking-api';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

const options = earnStakingWorkerBaseUrls.map(baseUrl => ({
    label: baseUrl,
    value: baseUrl,
}));

export const EarnStakingApi = () => {
    const { dispatch } = useServices(injectDispatch);
    const storedValue = useSelector(selectEarnStakingWorkerBaseUrl);

    const selectedValue = options.find(option => option.value === storedValue);

    const handleChange = (item: { value: EarnStakingWorkerBaseUrl; label: string }) => {
        dispatch(suiteSettingsActions.setDebugMode({ earnStakingWorkerBaseUrl: item.value }));
        earnStakingWorkerBaseUrl.set(item.value);

        // Staking data fetched from the previous base URL is already cached in the app state.
        // Since this is a debug setting, the easiest way to re-fetch it is to reload the app,
        // with a slight delay to let the browser save the settings first.
        setTimeout(() => {
            globalThis.location.reload();
        }, 100);
    };

    return (
        <SectionItem
            title="Staking worker base URL"
            description="Set the base url for the earn staking worker"
            actions={
                <SectionItem.Select
                    onChange={handleChange}
                    value={selectedValue}
                    options={options}
                    menuAlign="end"
                />
            }
        />
    );
};
