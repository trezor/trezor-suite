import { useSelector } from 'react-redux';

import { selectIsAppsEmbeddingEnabled, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

export const AppsEmbeddingSwitch = () => {
    const isAppsEmbeddingEnabled = useSelector(selectIsAppsEmbeddingEnabled);
    const { dispatch } = useServices(injectDispatch);

    const handleChange = (isChecked: boolean) =>
        dispatch(suiteSettingsActions.setDebugMode({ isAppsEmbeddingEnabled: isChecked }));

    return (
        <SectionItem
            title="Apps embedding showcase"
            description="Playground for testing embedded apps and later on dApps."
            actions={
                <Switch
                    isChecked={isAppsEmbeddingEnabled}
                    onChange={handleChange}
                    data-testid="@settings/debug/apps-embedding/switch"
                />
            }
        />
    );
};
