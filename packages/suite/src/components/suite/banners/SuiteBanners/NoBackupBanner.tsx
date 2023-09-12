import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Banner } from '../Banner';

export const NoBackup = () => {
    const dispatch = useDispatch();

    const action = {
        label: <Translation id="TR_CREATE_BACKUP" />,
        onClick: () => dispatch(goto('backup-index')),
        'data-test': '@notification/no-backup/button',
    };

    return (
        <Banner
            variant="critical"
            body={
                <>
                    <Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />{' '}
                    <Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />
                </>
            }
            action={action}
        />
    );
};
