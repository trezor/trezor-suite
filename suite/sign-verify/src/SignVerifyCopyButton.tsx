import { Translation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Button } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { copyToClipboard } from '@trezor/dom-utils';
import { CopyIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

type SignVerifyCopyButtonProps = {
    value: string;
    'data-testid': string;
};

export const SignVerifyCopyButton = ({
    value,
    'data-testid': dataTestId,
}: SignVerifyCopyButtonProps) => {
    const { dispatch } = useServices(injectDispatch);

    const copyValue = async () => {
        const result = await copyToClipboard(value);

        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <Button
            type="button"
            intent="brand"
            priority="secondary"
            size="small"
            iconLeft={CopyIcon}
            onClick={copyValue}
            data-testid={dataTestId}
        >
            <Translation id="TR_COPY_TO_CLIPBOARD" />
        </Button>
    );
};
