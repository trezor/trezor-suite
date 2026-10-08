import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    selectIsSuiteSyncDebugEnabled,
    updateSuiteSyncDebugEnabled,
} from '@suite-common/suite-sync';
import { Checkbox } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

import { SuiteSyncConnectionStatus } from './SuiteSyncConnectionStatus';

export const SuiteSyncSettingsDebug = () => {
    const { dispatch } = useServices(injectDispatch);
    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);

    const handleToggleSuiteSyncDebug = () => {
        dispatch(updateSuiteSyncDebugEnabled({ isEnabled: !isSuiteSyncDebugEnabled }));
    };

    return (
        <>
            <SectionItem
                title="Suite Sync (Evolu) Debug"
                actions={
                    <Checkbox
                        data-testid="@settings/debug/suite-sync/debug-toggle"
                        isChecked={isSuiteSyncDebugEnabled}
                        onChange={handleToggleSuiteSyncDebug}
                    />
                }
            />

            <SuiteSyncConnectionStatus />
        </>
    );
};
