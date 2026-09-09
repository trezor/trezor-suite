import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { copyToClipboard } from '@trezor/dom-utils';

export const useSignVerifyCopyValue = () => {
    const { dispatch } = useServices(selectDispatch);

    return async (value: string) => {
        const result = await copyToClipboard(value);

        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };
};
