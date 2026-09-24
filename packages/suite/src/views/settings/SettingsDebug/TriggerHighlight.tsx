import { SettingsAnchor, gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { SectionItem } from '@trezor/product-components';

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
