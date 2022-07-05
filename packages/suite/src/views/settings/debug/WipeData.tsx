import React from 'react';
import { desktopApi } from '@trezor/suite-desktop-api';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useSelector } from '@suite-hooks';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

export const WipeData = () => {
    const userDataDir = useSelector(state => state.desktop?.paths.userDir);
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.WipeData);

    return (
        <SectionItem
            data-test="@settings/debug/wipe-data"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title="Wipe app data"
                description={`Clicking this button restarts your application and wipes all your data including locally saved labels. ${
                    userDataDir ? `Your local folder is: ${userDataDir}` : ''
                }`}
            />
            <ActionColumn>
                <ActionButton
                    variant="danger"
                    onClick={async () => {
                        await desktopApi.clearUserData();
                        desktopApi.appRestart();
                    }}
                >
                    Wipe data
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
