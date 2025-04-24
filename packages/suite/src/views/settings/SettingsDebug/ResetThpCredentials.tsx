import { notificationsActions } from '@suite-common/toast-notifications';
import { deviceActions } from '@suite-common/wallet-core';
import { Button, Text } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

import { useDispatch } from '../../../hooks/suite';

export const ResetThpCredentials = () => {
    const dispatch = useDispatch();

    const onClick = () => {
        dispatch(deviceActions.setThpCredentials({ credentials: [] }));
        dispatch(notificationsActions.addToast({ type: 'thp-credentials-reset' }));
    };

    return (
        <SectionItem data-testid="@settings/debug/reset-thp-credentials">
            <TextColumn
                title="Reset THP credentials"
                description={
                    <>
                        Delete all THP credentials stored in the Suite.{' '}
                        <Text variant="warning">Refresh of the Suite needed afterwards.</Text>
                    </>
                }
            />
            <ActionColumn>
                <Button onClick={onClick}>Reset</Button>
            </ActionColumn>
        </SectionItem>
    );
};
