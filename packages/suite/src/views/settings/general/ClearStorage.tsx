import React from 'react';

import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { Translation } from '@suite-components';
import * as storageActions from '@suite-actions/storageActions';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';

export const ClearStorage = () => {
    const { removeDatabase, goto } = useActions({
        removeDatabase: storageActions.removeDatabase,
        goto: routerActions.goto,
    });

    return (
        <SectionItem data-test="@settings/storage">
            <TextColumn
                title={<Translation id="TR_SUITE_STORAGE" />}
                description={<Translation id="TR_CLEAR_STORAGE_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={async () => {
                        localStorage.clear();
                        removeDatabase();
                        if (window.desktopApi) {
                            // Reset the desktop-specific store.
                            window.desktopApi.clearStore();
                            // relaunch desktop app
                            window.desktopApi.appRestart();
                        } else {
                            // redirect to / and reload the web
                            await goto('suite-index');
                            window.location.reload();
                        }
                    }}
                    variant="secondary"
                    data-test="@settings/reset-app-button"
                >
                    <Translation id="TR_CLEAR_STORAGE" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
