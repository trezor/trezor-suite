import { notificationsActions } from '@suite-common/toast-notifications';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch } from '../../../hooks/suite';

export const TriggerToast = () => {
    const dispatch = useDispatch();

    return (
        <SectionItem data-testid="@settings/debug/github">
            <TextColumn title="Trigger toast" />
            <ActionColumn>
                <ActionButton
                    intent="brand"
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
