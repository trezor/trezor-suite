import { useState } from 'react';

import styled from 'styled-components';

import { notificationsActions } from '@suite-common/toast-notifications';
import { Modal, ModalProps, Paragraph, Switch } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { db } from 'src/storage';

export const AnonymousModeConfirmModal = ({ onCancel }: ModalProps) => {
    // Abusing db instance as a storage for global variable..
    // But since the app restarts after every change, there is no need for state management and reactivity.
    const { isAnonymousMode } = db;
    const willBeEnabled = !isAnonymousMode;
    const dispatch = useDispatch();

    const toggleAnonymousMode = async () => {
        const result = await desktopApi.setAnonymousMode(!isAnonymousMode);
        if (!result.success) {
            return dispatch(notificationsActions.addToast({ type: 'error', error: result.error }));
        }
        desktopApi.appRestart();
    };

    const heading = `${willBeEnabled ? 'Enable' : 'Disable'} Anonymous Mode?`;

    return (
        <Modal
            onCancel={onCancel}
            heading={heading}
            variant={willBeEnabled ? 'destructive' : 'warning'}
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={toggleAnonymousMode}>Confirm</Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                        Cancel
                    </Modal.Button>
                </>
            }
        >
            {willBeEnabled && <Paragraph>All your data will be erased!</Paragraph>}
            <Paragraph>Trezor Suite will restart so that this setting can take effect.</Paragraph>
        </Modal>
    );
};

const UserDataLink = styled.span`
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
`;

export const WipeData = () => {
    const userDataDir = useSelector(state => state.desktop?.paths.userDir);
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleAnonymousModalClick = () => setIsModalOpen(true);
    const handleModalCancel = () => setIsModalOpen(false);
    const { isAnonymousMode } = db;

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
        <>
            <SectionItem>
                <TextColumn
                    title="Wipe app data"
                    description={
                        <span>
                            Clicking this button restarts your application and wipes all your data
                            including locally saved labels. Your local folder is:{' '}
                            <UserDataLink onClick={openUserDataDir}>{userDataDir}</UserDataLink>.
                            Note that this will reset Anonymous mode as well.
                        </span>
                    }
                />
                <ActionColumn>
                    <ActionButton intent="critical" onClick={clearUserData}>
                        Wipe data
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Anonymous mode"
                    description={
                        <span>
                            In Anonymous Mode, Suite Desktop will not persist any user data – will
                            behave like Suite Web in an incognito window.
                        </span>
                    }
                />
                <ActionColumn>
                    <Switch onChange={handleAnonymousModalClick} isChecked={isAnonymousMode} />
                </ActionColumn>
            </SectionItem>
            {isModalOpen && <AnonymousModeConfirmModal onCancel={handleModalCancel} />}
        </>
    );
};
