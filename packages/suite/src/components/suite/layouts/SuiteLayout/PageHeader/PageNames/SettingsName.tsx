import { useDebugModeActivator } from '@suite/debug';
import { Translation } from '@suite/intl';

import { BasicName } from './BasicName';

export const SettingsName = () => {
    const handleTitleClick = useDebugModeActivator();

    return (
        <BasicName onClick={handleTitleClick} data-testid="@settings/menu/title">
            <Translation id="TR_SETTINGS" />
        </BasicName>
    );
};
