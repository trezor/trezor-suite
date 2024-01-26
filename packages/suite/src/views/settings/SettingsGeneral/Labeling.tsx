import { analytics, EventType } from '@trezor/suite-analytics';
import { LoadingContent, Switch, Tooltip } from '@trezor/components';
import { HELP_CENTER_LABELING } from '@trezor/urls';

import { ActionColumn, SectionItem, TextColumn, Translation } from 'src/components/suite';
import { useSelector, useDispatch, useDevice, useDiscovery } from 'src/hooks/suite';
import * as metadataActions from 'src/actions/suite/metadataActions';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

export const Labeling = () => {
    const metadata = useSelector(state => state.metadata);

    const { device, isLocked } = useDevice();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Labeling);
    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();

    const handleSwitchClick = () => {
        if (metadata.enabled) {
            dispatch(metadataActions.disableMetadata());
        } else {
            dispatch(metadataLabelingActions.init(true));
        }

        analytics.report({
            type: EventType.SettingsGeneralLabeling,
            payload: {
                value: !metadata.enabled,
            },
        });
    };

    // This should ideally not depend on the device so it should never be disabled.
    // But if user have REMEMBERED device DISCONNECTED, he would get to the wrong state where
    // Labeling is turned on in Settings, but not accessible at all and user is not informed
    // what to do to enable it. That is why it's disabled for now in that case.
    //
    // Following use cases need some bigger UX refactoring:
    // - Labeling enabled without any device connected
    // - Labeling enabled with the device connected inside Settings
    // The initialization of Labeling then start when user select a Wallet.
    const isDisabled = isLocked() || device?.mode !== 'normal';

    return (
        <SectionItem
            data-test="@settings/metadata"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={
                    <LoadingContent isLoading={metadata.initiating} isSuccessful={metadata.enabled}>
                        <Translation id="TR_LABELING_ENABLED" />
                    </LoadingContent>
                }
                description={<Translation id="TR_LABELING_FEATURE_ALLOWS" />}
                buttonLink={HELP_CENTER_LABELING}
            />
            <ActionColumn>
                <Tooltip
                    maxWidth={280}
                    offset={10}
                    placement="top"
                    content={
                        isDisabled &&
                        !isDiscoveryRunning && <Translation id="TR_DISABLED_SWITCH_TOOLTIP" />
                    }
                >
                    <Switch
                        isDisabled={isDisabled || metadata.initiating}
                        dataTest="@settings/metadata-switch"
                        isChecked={metadata.enabled}
                        onChange={handleSwitchClick}
                    />
                </Tooltip>
            </ActionColumn>
        </SectionItem>
    );
};
