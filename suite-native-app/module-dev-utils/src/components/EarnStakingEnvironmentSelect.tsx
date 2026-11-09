import { useSelector } from 'react-redux';

import {
    type EarnStakingWorkerBaseUrl,
    defaultEarnStakingWorkerBaseUrl,
    earnStakingWorkerBaseUrl,
    earnStakingWorkerBaseUrls,
} from '@suite-common/earn-staking-api';
import { Select, type SelectItemType } from '@suite-native/atoms';
import {
    selectEarnStakingWorkerBaseUrl,
    setEarnStakingWorkerEnvironment,
} from '@suite-native/settings';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

const earnStakingWorkerBaseUrlItems: SelectItemType<EarnStakingWorkerBaseUrl>[] =
    earnStakingWorkerBaseUrls.map(baseUrl => ({
        value: baseUrl,
        label: baseUrl,
    }));

export const EarnStakingEnvironmentSelect = () => {
    const storedValue = useSelector(selectEarnStakingWorkerBaseUrl);
    const { dispatch } = useServices(injectDispatch);

    const handleSelectEnvironment = (baseUrl: EarnStakingWorkerBaseUrl) => {
        dispatch(setEarnStakingWorkerEnvironment(baseUrl));
        earnStakingWorkerBaseUrl.set(baseUrl);
    };

    return (
        <Select<EarnStakingWorkerBaseUrl>
            title="Staking worker base URL"
            items={earnStakingWorkerBaseUrlItems}
            value={storedValue ?? defaultEarnStakingWorkerBaseUrl}
            onSelectItem={handleSelectEnvironment}
            labelType="innerLabel"
        />
    );
};
