import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useTranslation } from 'src/hooks/suite';
import { Banner } from '@trezor/components';

export const NoBackup = () => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const translation = `${translationString(
        'TR_YOUR_TREZOR_IS_NOT_BACKED_UP',
    )} ${translationString('TR_IF_YOUR_DEVICE_IS_EVER_LOST')}`;

    return (
        <Banner
            icon
            variant="destructive"
            rightContent={
                <Banner.Button
                    onClick={() => dispatch(goto('backup-index'))}
                    data-testid="@notification/no-backup/button"
                >
                    <Translation id="TR_CREATE_BACKUP" />
                </Banner.Button>
            }
        >
            {translation}
        </Banner>
    );
};
