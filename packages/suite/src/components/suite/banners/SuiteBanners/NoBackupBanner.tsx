import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useTranslation } from 'src/hooks/suite';
import { Warning } from '@trezor/components';

export const NoBackup = () => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const translation = `${translationString(
        'TR_YOUR_TREZOR_IS_NOT_BACKED_UP',
    )} ${translationString('TR_IF_YOUR_DEVICE_IS_EVER_LOST')}`;

    return (
        <Warning
            icon
            variant="destructive"
            rightContent={
                <Warning.Button
                    onClick={() => dispatch(goto('backup-index'))}
                    data-testid="@notification/no-backup/button"
                >
                    <Translation id="TR_CREATE_BACKUP" />
                </Warning.Button>
            }
        >
            {translation}
        </Warning>
    );
};
