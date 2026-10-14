import { SettingsAnchor, gotoThunk } from '@suite/router';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

export const TriggerHighlight = () => {
    const { dispatch } = useServices(injectDispatch);

    return (
        <SectionItem
            data-testid="@settings/debug/github"
            title="Trigger highlight"
            description="Goes to the anchor in the application and highlights it. This allows testing of this functionality with custom anchor."
            actions={
                <SectionItem.Button
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
                </SectionItem.Button>
            }
        />
    );
};
