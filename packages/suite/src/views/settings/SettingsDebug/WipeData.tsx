import styled from 'styled-components';

import { notificationsActions } from '@suite-common/toast-notifications';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useDispatch, useSelector } from 'src/hooks/suite';

const UserDataLink = styled.span`
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
`;

export const WipeData = () => {
    const userDataDir = useSelector(state => state.desktop?.paths.userDir);
    const dispatch = useDispatch();

    const openUserDataDir = async () => {
        const result = await desktopApi.openUserDataDirectory();
        if (!result.success) {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.error }));
        }
    };

    const clearUserData = async () => {
        const result = await desktopApi.clearUserData();
        if (!result.success) {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.error }));

            return;
        }
        desktopApi.appRestart();
    };

    return (
        <SectionItem>
            <TextColumn
                title="Wipe app data"
                description={
                    <span>
                        Clicking this button restarts your application and wipes all your data
                        including locally saved labels. Your local folder is:{' '}
                        <UserDataLink onClick={openUserDataDir}>{userDataDir}</UserDataLink>
                    </span>
                }
            />
            <ActionColumn>
                <ActionButton intent="critical" onClick={clearUserData}>
                    Wipe data
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
