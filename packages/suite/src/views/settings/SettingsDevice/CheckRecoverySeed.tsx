import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor, goto } from '@suite/router';
import { getCheckBackupUrl } from '@suite-common/suite-utils';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useDispatch } from 'src/hooks/suite';

interface CheckRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const CheckRecoverySeed = ({ isDeviceLocked }: CheckRecoverySeedProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const needsBackup = device?.features?.backup_availability === 'Required';
    const learnMoreUrl = getCheckBackupUrl(device);

    const handleClick = () =>
        dispatch(goto({ routeName: 'recovery-index', params: { cancelable: true } }));

    if (needsBackup) return null;

    return (
        <Anchor anchorId={SettingsAnchor.CheckRecoverySeed}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_CHECK_RECOVERY_SEED" />}
                        description={<Translation id="TR_CHECK_RECOVERY_SEED_DESCRIPTION" />}
                        bottomContent={
                            learnMoreUrl ? <LearnMoreButton url={learnMoreUrl} /> : undefined
                        }
                    />
                    <ActionColumn>
                        <ActionButton
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
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
