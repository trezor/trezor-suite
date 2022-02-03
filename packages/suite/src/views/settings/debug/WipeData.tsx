import React, { useState, useEffect } from 'react';
import { desktopApi } from '@trezor/suite-desktop-api';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { isWeb } from '@suite-utils/env';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

import type { Await } from '@suite/types/utils';

type UserData = Extract<
    Await<ReturnType<NonNullable<typeof desktopApi>['getUserDataInfo']>>,
    { success: true }
>;

export const WipeData = () => {
    const [userData, setUserData] = useState<UserData['payload'] | null>(null);
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.WipeData);

    useEffect(() => {
        if (isWeb()) {
            return;
        }
        const getUserDataInfo = async () => {
            const result = await desktopApi.getUserDataInfo();
            if (result.success) {
                setUserData(result.payload);
            }
        };
        getUserDataInfo();
    }, []);

    return (
        <SectionItem
            data-test="@settings/debug/wipe-data"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title="Wipe app data"
                description={`Clicking this button restarts your application and wipes all your data including locally saved labels. ${
                    userData?.dir ? `Your local folder is: ${userData.dir}` : ''
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
