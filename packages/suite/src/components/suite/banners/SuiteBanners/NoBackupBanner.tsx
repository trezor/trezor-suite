import { Translation, useTranslation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const NoBackup = () => {
    const { dispatch } = useServices(injectDispatch);
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
                    onClick={() => dispatch(gotoThunk({ routeName: 'backup-index' }))}
                    data-testid="@notification/no-backup/button"
                >
                    <Translation id="TR_CREATE_BACKUP" />
                </Banner.Button>
            }
            description={translation}
        />
    );
};
