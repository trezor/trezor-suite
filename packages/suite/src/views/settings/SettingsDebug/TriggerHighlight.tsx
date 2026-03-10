import { SettingsAnchor } from '@suite/router';

import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

import { goto } from '../../../actions/suite/routerActions';
import { useDispatch } from '../../../hooks/suite';

export const TriggerHighlight = () => {
    const dispatch = useDispatch();

    return (
        <SectionItem data-testid="@settings/debug/github">
            <TextColumn
                title="Trigger highlight"
                description="Goes to the anchor in the application and highlights it. This allows testing of this functionality with custom anchor."
            />
            <ActionColumn>
                <ActionButton
                    intent="brand"
                    onClick={() =>
                        dispatch(goto('settings-index', { anchor: SettingsAnchor.Labeling }))
                    }
                >
                    Go to Labeling
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
