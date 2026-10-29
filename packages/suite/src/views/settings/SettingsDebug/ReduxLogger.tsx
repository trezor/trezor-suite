import { selectIsReduxLoggerEnabled, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

export const ReduxLogger = () => {
    const isReduxLoggerEnabled = useSelector(selectIsReduxLoggerEnabled);
    const { dispatch } = useServices(injectDispatch);

    const toggleReduxLogger = () =>
        dispatch(
            suiteSettingsActions.setDebugMode({ isReduxLoggerEnabled: !isReduxLoggerEnabled }),
        );

    return (
        <SectionItem
            title="Redux logger"
            description="Log every action with the previous and next state to the console. Logged states stay in memory while DevTools are open."
            actions={<Switch isChecked={isReduxLoggerEnabled} onChange={toggleReduxLogger} />}
        />
    );
};
