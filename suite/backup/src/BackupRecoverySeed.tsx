import { useSelector } from 'react-redux';

import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor, gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { injectDispatch } from '@suite-common/redux-utils';
import { SectionItem } from '@trezor/product-components';
import { HELP_CENTER_RECOVERY_SEED_URL } from '@trezor/urls';

interface BackupRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const BackupRecoverySeed = ({ isDeviceLocked }: BackupRecoverySeedProps) => {
    const { dispatch } = useServices(injectDispatch);
    const device = useSelector(selectSelectedDevice);

    const needsBackup = device?.features?.backup_availability === 'Required';

    const handleClick = () =>
        dispatch(gotoThunk({ routeName: 'backup-index', params: { cancelable: true } }));

    if (!needsBackup) return null;

    return (
        <Anchor anchorId={SettingsAnchor.BackupRecoverySeed}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_BACKUP_RECOVERY_SEED" />}
                    description={<Translation id="TR_BACKUP_SUBHEADING_1" />}
                    bottomContent={<LearnMoreButton url={HELP_CENTER_RECOVERY_SEED_URL} />}
                    actions={
                        <SectionItem.Button
                            data-testid="@settings/device/create-backup-button"
                            onClick={handleClick}
                            isDisabled={isDeviceLocked}
                            isTooltipActive={isDeviceLocked}
                            tooltipContent={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Translation id="TR_CREATE_BACKUP" />
                        </SectionItem.Button>
                    }
                />
            )}
        </Anchor>
    );
};
