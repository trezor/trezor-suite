import { useDevice } from '@suite/device';
import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor, gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { getCheckBackupUrl } from '@suite-common/suite-utils';
import { SectionItem } from '@trezor/product-components';

interface CheckRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const CheckRecoverySeed = ({ isDeviceLocked }: CheckRecoverySeedProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { device } = useDevice();

    const needsBackup = device?.features?.backup_availability === 'Required';
    const learnMoreUrl = getCheckBackupUrl(device);

    const handleClick = () =>
        dispatch(gotoThunk({ routeName: 'recovery-index', params: { cancelable: true } }));

    if (needsBackup) return null;

    return (
        <Anchor anchorId={SettingsAnchor.CheckRecoverySeed}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_CHECK_RECOVERY_SEED" />}
                    description={<Translation id="TR_CHECK_RECOVERY_SEED_DESCRIPTION" />}
                    bottomContent={
                        learnMoreUrl ? <LearnMoreButton url={learnMoreUrl} /> : undefined
                    }
                    actions={
                        <SectionItem.Button
                            data-testid="@settings/device/check-seed-button"
                            onClick={handleClick}
                            isDisabled={isDeviceLocked}
                            intent="brand"
                            isTooltipActive={isDeviceLocked}
                            tooltipContent={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Translation id="TR_CHECK_SEED" />
                        </SectionItem.Button>
                    }
                />
            )}
        </Anchor>
    );
};
