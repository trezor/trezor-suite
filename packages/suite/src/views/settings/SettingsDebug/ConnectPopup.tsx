import { useEffect, useState } from 'react';

import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';

export const ConnectPopup = () => {
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        if (desktopApi.available) {
            desktopApi.connectPopupEnabled().then(enabled => setIsEnabled(enabled));
        }
    }, []);

    const handleOnChange = async () => {
        if (desktopApi.available) {
            const newState = !isEnabled;
            setIsEnabled(newState);
            await desktopApi.connectPopupSetEnabled(newState);
        }
    };

    return (
        <SectionItem>
            <TextColumn
                title="Connect Popup"
                description="Enable communication between Connect in 3rd party apps and Trezor Suite. Toggling restarts the application."
            />
            <ActionColumn>
                <Switch isChecked={isEnabled} onChange={handleOnChange} />
            </ActionColumn>
        </SectionItem>
    );
};
