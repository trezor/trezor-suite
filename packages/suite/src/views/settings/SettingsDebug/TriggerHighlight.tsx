import { SettingsAnchor, gotoThunk } from '@suite/router';
import { injectDispatch } from '@suite-common/redux-utils';
import { useServices } from '@trezor/dependency-injection';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

export const TriggerHighlight = () => {
    const { dispatch } = useServices(injectDispatch);

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
                        dispatch(
                            gotoThunk({
                                routeName: 'settings-index',
                                anchor: SettingsAnchor.Labeling,
                            }),
                        )
                    }
                >
                    Go to Labeling
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
