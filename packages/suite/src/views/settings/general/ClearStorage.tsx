import React from 'react';
import { desktopApi } from '@trezor/suite-desktop-api';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { Translation } from 'src/components/suite';
import * as storageActions from 'src/actions/suite/storageActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { useActions } from 'src/hooks/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { reloadApp } from 'src/utils/suite/reload';

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
                        } else {
                            // redirect to / and reload the web
                            await goto('suite-index');
                        }
                        reloadApp();
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
