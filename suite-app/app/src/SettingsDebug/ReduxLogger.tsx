import { useState } from 'react';

import { Switch } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';

import { injectReduxLoggerControl } from '../createReduxLogger';

export const ReduxLogger = () => {
    const { reduxLoggerControl } = useServices(injectReduxLoggerControl);
    const [isEnabled, setIsEnabled] = useState(() => reduxLoggerControl?.isEnabled() ?? false);

    // Codesign builds carry no logger.
    if (!reduxLoggerControl) return null;

    const handleChange = (isChecked: boolean) => {
        setIsEnabled(isChecked);

        if (isChecked) {
            reduxLoggerControl.enable().catch(() => setIsEnabled(false));
        } else {
            reduxLoggerControl.disable();
        }
    };

    return (
        <SectionItem
            data-testid="@settings/debug/redux-logger"
            title="Redux logger"
            description="Log every action with the previous and next state to the console. While DevTools are open, every logged state stays in memory, so keep it off when measuring memory."
            actions={
                <Switch
                    data-testid="@settings/debug/redux-logger/switch"
                    isChecked={isEnabled}
                    onChange={handleChange}
                />
            }
        />
    );
};
