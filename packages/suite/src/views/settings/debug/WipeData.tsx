import React, { useState, useEffect } from 'react';

import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { isWeb } from '@suite-utils/env';

import type { Await } from '@suite/types/utils';

type UserData = Extract<
    Await<ReturnType<NonNullable<typeof window['desktopApi']>['getUserDataInfo']>>,
    { success: true }
>;

export const WipeData = () => {
    const [userData, setUserData] = useState<UserData['payload'] | null>(null);

    useEffect(() => {
        if (isWeb()) {
            return;
        }
        const getUserDataInfo = async () => {
            const result = await window.desktopApi!.getUserDataInfo();
            if (result.success) {
                setUserData(result.payload);
            }
        };
        getUserDataInfo();
    }, []);

    return (
        <SectionItem>
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
                        await window.desktopApi!.clearUserData();
                        window.desktopApi!.appRestart();
                    }}
                >
                    Wipe data
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
