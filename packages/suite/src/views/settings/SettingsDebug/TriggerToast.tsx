import { notificationsActions } from '@suite-common/toast-notifications';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

export const TriggerToast = () => {
    const { dispatch } = useServices(injectDispatch);

    return (
        <SectionItem
            data-testid="@settings/debug/github"
            title="Trigger toast"
            actions={
                <SectionItem.Button
                    intent="brand"
                    onClick={() => {
                        dispatch(notificationsActions.addToast({ type: 'auto-eject-settings' }));
                    }}
                >
                    Show toast
                </SectionItem.Button>
            }
        />
    );
};
