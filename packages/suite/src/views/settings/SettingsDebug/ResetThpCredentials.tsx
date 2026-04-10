import { useState } from 'react';

import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { removeThpCredentialsThunk } from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const ResetThpCredentials = () => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);

    const onClick = async () => {
        if (!device) {
            return null;
        }

        setIsLoading(true);

        await dispatch(removeThpCredentialsThunk({ device })).unwrap();

        // This is a bit of a hack, to force use to reconnect the device. Device still has
        // the session, but Suite discarded all THP credentials.
        dispatch(deviceActions.deviceDisconnect(device));

        dispatch(notificationsActions.addToast({ type: 'thp-credentials-reset' }));

        setTimeout(() => setIsLoading(false), 300);
    };

    return (
        <SectionItem data-testid="@settings/debug/reset-thp-credentials">
            <TextColumn
                title="Reset THP credentials"
                description="Delete all THP credentials stored in the Suite for the connected device."
            />
            <ActionColumn>
                <ActionButton
                    isTooltipActive={!device}
                    tooltipContent="Connect device to reset THP credentials"
                    isDisabled={!device}
                    onClick={onClick}
                    isLoading={isLoading}
                >
                    Reset
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
