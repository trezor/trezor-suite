import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { SectionItem } from '@trezor/product-components';

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
