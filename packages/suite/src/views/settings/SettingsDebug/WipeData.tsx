import styled from 'styled-components';

import { injectDesktopApi } from '@suite/desktop-app-api';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { injectReloadApp } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { selectDesktopUserDataDirectory } from 'src/reducers/desktop';

const UserDataLink = styled.span`
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
`;

export const WipeData = () => {
    const userDataDir = useSelector(selectDesktopUserDataDirectory);
    const { desktopApi, reloadApp, dispatch } = useServices(
        injectReloadApp,
        injectDispatch,
        injectDesktopApi,
    );

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
        reloadApp();
    };

    return (
        <SectionItem
            title="Wipe app data"
            description={
                <span>
                    Clicking this button restarts your application and wipes all your data including
                    locally saved labels. Your local folder is:{' '}
                    <UserDataLink onClick={openUserDataDir}>{userDataDir}</UserDataLink>
                </span>
            }
            actions={
                <SectionItem.Button intent="critical" onClick={clearUserData}>
                    Wipe data
                </SectionItem.Button>
            }
        />
    );
};
