import { useDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { copyToClipboard } from '@trezor/dom-utils';

export const useSignVerifyCopyValue = () => {
    const dispatch = useDispatch();

    return async (value: string) => {
        const result = await copyToClipboard(value);

        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };
};
