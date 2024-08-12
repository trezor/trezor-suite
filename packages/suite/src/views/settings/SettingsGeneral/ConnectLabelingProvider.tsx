import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

export const ConnectLabelingProvider = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(metadataLabelingActions.init(true));

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.LabelingConnect}>
            <TextColumn
                title={<Translation id="TR_LABELING_NOT_SYNCED" />}
                description={<Translation id="TR_TO_MAKE_YOUR_LABELS_PERSISTENT" />}
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    onClick={handleClick}
                    data-testid="@settings/metadata/connect-provider-button"
                >
                    <Translation id="TR_CONNECT" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
