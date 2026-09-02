import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import {
    selectIsSuiteSyncDebugEnabled,
    updateSuiteSyncDebugEnabled,
} from '@suite-common/suite-sync';
import { Checkbox } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { SuiteSyncConnectionStatus } from './SuiteSyncConnectionStatus';

export const SuiteSyncSettingsDebug = () => {
    const dispatch = useDispatch();
    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);

    const handleToggleSuiteSyncDebug = () => {
        dispatch(updateSuiteSyncDebugEnabled({ isEnabled: !isSuiteSyncDebugEnabled }));
    };

    return (
        <>
            <SectionItem>
                <TextColumn title="Suite Sync (Evolu) Debug" />
                <ActionColumn>
                    <Checkbox
                        data-testid="@settings/debug/suite-sync/debug-toggle"
                        isChecked={isSuiteSyncDebugEnabled}
                        onChange={handleToggleSuiteSyncDebug}
                    />
                </ActionColumn>
            </SectionItem>
            <SuiteSyncConnectionStatus />
        </>
    );
};
