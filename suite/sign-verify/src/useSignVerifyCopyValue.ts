import { injectDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useServices } from '@trezor/dependency-injection';
import { copyToClipboard } from '@trezor/dom-utils';

export const useSignVerifyCopyValue = () => {
    const { dispatch } = useServices(injectDispatch);

    return async (value: string) => {
        const result = await copyToClipboard(value);

        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };
};
