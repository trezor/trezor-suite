import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useTranslation } from 'src/hooks/suite';
import { Banner } from '../Banner';

export const NoBackup = () => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const action = {
        label: <Translation id="TR_CREATE_BACKUP" />,
        onClick: () => dispatch(goto('backup-index')),
        'data-test': '@notification/no-backup/button',
    };

    const translation = `${translationString(
        'TR_YOUR_TREZOR_IS_NOT_BACKED_UP',
    )} ${translationString('TR_IF_YOUR_DEVICE_IS_EVER_LOST')}`;

    return <Banner variant="destructive" body={translation} action={action} />;
};
