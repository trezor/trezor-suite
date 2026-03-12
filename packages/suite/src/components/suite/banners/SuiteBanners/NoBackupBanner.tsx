import { Translation, useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { Banner } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';

export const NoBackup = () => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const translation = `${translationString(
        'TR_YOUR_TREZOR_IS_NOT_BACKED_UP',
    )} ${translationString('TR_IF_YOUR_DEVICE_IS_EVER_LOST')}`;

    return (
        <Banner
            icon
            intent="critical"
            rightContent={
                <Banner.Button
                    onClick={() => dispatch(goto({ routeName: 'backup-index' }))}
                    data-testid="@notification/no-backup/button"
                >
                    <Translation id="TR_CREATE_BACKUP" />
                </Banner.Button>
            }
            description={translation}
        />
    );
};
