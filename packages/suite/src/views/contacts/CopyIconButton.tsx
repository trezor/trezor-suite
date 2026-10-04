import { Translation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import { IconButton } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { CopyIcon } from '@trezor/icons';

import { useDispatch } from 'src/hooks/suite';

type CopyIconButtonProps = {
    value: string;
    dataTestId?: string;
};

export const CopyIconButton = ({ value, dataTestId }: CopyIconButtonProps) => {
    const dispatch = useDispatch();

    const handleCopy = async () => {
        const result = await copyToClipboard(value);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <IconButton
            icon={CopyIcon}
            size="small"
            intent="neutral"
            priority="secondary"
            onClick={handleCopy}
            tooltip={{ content: <Translation id="TR_COPY_TO_CLIPBOARD" /> }}
            data-testid={dataTestId}
        />
    );
};
