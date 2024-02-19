import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

export const ConnectLabelingProvider = () => {
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.LabelingConnect);
    const dispatch = useDispatch();

    return (
        <SectionItem
            data-test-id="@settings/labeling-connect"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_LABELING_NOT_SYNCED" />}
                description={<Translation id="TR_TO_MAKE_YOUR_LABELS_PERSISTENT" />}
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    onClick={() => dispatch(metadataLabelingActions.init(true))}
                    data-test-id="@settings/metadata/connect-provider-button"
                >
                    <Translation id="TR_CONNECT" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
