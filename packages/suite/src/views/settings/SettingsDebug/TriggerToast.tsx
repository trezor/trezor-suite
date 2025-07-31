import { notificationsActions } from '@suite-common/toast-notifications';

import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

import { useDispatch } from '../../../hooks/suite';

export const TriggerToast = () => {
    const dispatch = useDispatch();

    return (
        <SectionItem data-testid="@settings/debug/github">
            <TextColumn title="Trigger toast" />
            <ActionColumn>
                <ActionButton
                    variant="primary"
                    onClick={() => {
                        dispatch(notificationsActions.addToast({ type: 'auto-eject-settings' }));
                    }}
                >
                    Show toast
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
