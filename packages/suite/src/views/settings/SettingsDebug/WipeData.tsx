import styled from 'styled-components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { notificationsActions } from '@suite-common/toast-notifications';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const UserDataLink = styled.span`
    cursor: pointer;
    :hover {
        text-decoration: underline;
    }
`;

export const WipeData = () => {
    const userDataDir = useSelector(state => state.desktop?.paths.userDir);
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.WipeData);

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
                                    dispatch(
                                        notificationsActions.addToast({
                                            type: 'error',
                                            error: result.error,
                                        }),
                                    );
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
