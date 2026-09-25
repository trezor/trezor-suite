import { useEffect, useState } from 'react';

import { injectDesktopApi } from '@suite/desktop-app-api';
import { useServices } from '@suite-common/dependency-injection';
import { Switch } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

export const ConnectPopup = () => {
    const { desktopApi } = useServices(injectDesktopApi);
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        if (desktopApi.available) {
            desktopApi.connectPopupEnabled().then(enabled => setIsEnabled(enabled));
        }
    }, [desktopApi]);

    const handleOnChange = async () => {
        if (desktopApi.available) {
            const newState = !isEnabled;
            setIsEnabled(newState);
            await desktopApi.connectPopupSetEnabled(newState);
        }
    };

    return (
        <SectionItem
            title="Connect Popup"
            description="Enable communication between Connect in 3rd party apps and Trezor Suite. Toggling restarts the application."
            actions={<Switch isChecked={isEnabled} onChange={handleOnChange} />}
        />
    );
};
