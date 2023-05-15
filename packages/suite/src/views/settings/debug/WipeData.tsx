import React from 'react';
import styled from 'styled-components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useSelector, useActions } from '@suite-hooks';
import { useAnchor } from '@suite-hooks/useAnchor';
import { notificationsActions } from '@suite-common/toast-notifications';
import { SettingsAnchor } from '@suite-constants/anchors';

const UserDataLink = styled.span`
    cursor: pointer;

    :hover {
        text-decoration: underline;
    }
`;

export const WipeData = () => {
    const userDataDir = useSelector(state => state.desktop?.paths.userDir);
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.WipeData);
    const { addToast } = useActions({
        addToast: notificationsActions.addToast,
    });

    return (
        <SectionItem
            data-test="@settings/debug/wipe-data"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title="Wipe app data"
                description={
                    <span>
                        Clicking this button restarts your application and wipes all your data
                        including locally saved labels. Your local folder is:{' '}
                        <UserDataLink
                            onClick={async () => {
                                const result = await desktopApi.openUserDataDirectory();

                                if (!result.success) {
                                    addToast({
                                        type: 'error',
                                        error: result.error,
                                    });
                                }
                            }}
                        >
                            {userDataDir}
                        </UserDataLink>
                    </span>
                }
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
