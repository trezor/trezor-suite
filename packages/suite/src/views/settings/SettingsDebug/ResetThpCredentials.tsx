import { useState } from 'react';

import { removeThpAutoconnectThunk } from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

import { useDispatch, useSelector } from '../../../hooks/suite';

export const ResetThpCredentials = () => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);

    if (!device) {
        return null;
    }

    const onClick = async () => {
        setIsLoading(true);

        const result = await dispatch(removeThpAutoconnectThunk()).unwrap();

        if (result?.success) {
            // This is a bit of a hack, to force use to reconnect the device. Device still has
            // the session, but Suite discarded all THP credentials.
            dispatch(deviceActions.deviceDisconnect(device));

            dispatch(notificationsActions.addToast({ type: 'thp-credentials-reset' }));
        } else if (result && !result?.success) {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
        }

        setTimeout(() => setIsLoading(false), 300);
    };

    return (
        <SectionItem data-testid="@settings/debug/reset-thp-credentials">
            <TextColumn
                title="Reset THP credentials"
                description="Delete all THP credentials stored in the Suite for the connected device."
            />
            <ActionColumn>
                <Button onClick={onClick} isLoading={isLoading}>
                    Reset
                </Button>
            </ActionColumn>
        </SectionItem>
    );
};
