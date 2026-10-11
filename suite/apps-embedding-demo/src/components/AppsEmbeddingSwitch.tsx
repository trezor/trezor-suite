import { useSelector } from 'react-redux';

import { selectIsAppsEmbeddingEnabled, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

export const AppsEmbeddingSwitch = () => {
    const isAppsEmbeddingEnabled = useSelector(selectIsAppsEmbeddingEnabled);
    const { dispatch } = useServices(injectDispatch);

    const handleChange = (isChecked: boolean) =>
        dispatch(suiteSettingsActions.setDebugMode({ isAppsEmbeddingEnabled: isChecked }));

    return (
        <SectionItem>
            <TextColumn
                title="Apps embedding showcase"
                description="Adds an Apps embedding item to the sidebar, below Earn. It embeds external sites (iframe on web, WebContentsView on desktop) to observe how platform APIs like Apple Pay or Google Sign-In behave when embedded."
            />
            <ActionColumn>
                <Switch
                    isChecked={isAppsEmbeddingEnabled}
                    onChange={handleChange}
                    data-testid="@settings/debug/apps-embedding/switch"
                />
            </ActionColumn>
        </SectionItem>
    );
};
