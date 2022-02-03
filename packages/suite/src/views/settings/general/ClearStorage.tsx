import React from 'react';
import { desktopApi } from '@trezor/suite-desktop-api';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { Translation } from '@suite-components';
import * as storageActions from '@suite-actions/storageActions';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

export const ClearStorage = () => {
    const { removeDatabase, goto } = useActions({
        removeDatabase: storageActions.removeDatabase,
        goto: routerActions.goto,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.ClearStorage);

    return (
        <SectionItem
            data-test="@settings/storage"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_SUITE_STORAGE" />}
                description={<Translation id="TR_CLEAR_STORAGE_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={async () => {
                        localStorage.clear();
                        removeDatabase();
                        if (desktopApi.available) {
                            // Reset the desktop-specific store.
                            desktopApi.clearStore();
                            // relaunch desktop app
                            desktopApi.appRestart();
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
