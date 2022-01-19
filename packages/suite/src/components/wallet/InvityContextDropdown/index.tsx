import { Dropdown, DropdownRef } from '@trezor/components';
import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';
import type { AppState } from '@suite-types';
import { InvityContextDropdownButton } from './components/InvityContextDropdownButton';

const Wrapper = styled.div`
    margin-left: 12px;
    margin-right: 12px;
`;

const Note = styled.div`
    padding: 7px;
    background: ${props => props.theme.STROKE_GREY};
    opacity: 0.4;
    border-radius: 5px;
`;
interface InvityContextDropdownProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

const InvityContextDropdown = ({ selectedAccount }: InvityContextDropdownProps) => {
    const [open, setOpen] = useState(false);
    const { invityAuthentication } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
    }));
    // TODO: Sometimes react warning pops up in console with misused ref?
    const dropdownRef = useRef<DropdownRef>();
    const { navigateToInvityLogin } = useInvityNavigation(selectedAccount.account);
    const handleToggleChange = useCallback((isToggled: boolean) => {
        setOpen(isToggled);
    }, []);
    const isAuthenticated = !!invityAuthentication?.verified;
    const handleUnauthenticatedUserButtonClick = useCallback(() => {
        navigateToInvityLogin();
    }, [navigateToInvityLogin]);

    return (
        <Wrapper>
            {isAuthenticated ? (
                <Dropdown
                    ref={dropdownRef}
                    onToggle={() => handleToggleChange(!open)}
                    alignMenu="right"
                    horizontalPadding={6}
                    topPadding={0}
                    minWidth={230}
                    items={[
                        {
                            key: 'signed-as',
                            label: <Translation id="TR_INVITY_SIGNIN_DROPDOWN_MENU_LABEL" />,
                            options: [
                                {
                                    key: '1',
                                    label: invityAuthentication?.email,
                                    callback: () => false,
                                    isRounded: true,
                                    noHover: true,
                                },
                                {
                                    key: '2',
                                    label: (
                                        <Translation id="TR_INVITY_SIGNIN_DROPDOWN_MENU_SIGNOUT" />
                                    ),
                                    callback: () => {
                                        // TODO: invityAPI.logout(); etc...
                                    },
                                    isRounded: true,
                                },
                            ],
                        },
                        {
                            key: 'note',
                            options: [
                                {
                                    key: '3',
                                    label: (
                                        <Note>
                                            <Translation id="TR_INVITY_SIGNIN_DROPDOWN_MENU_NOTE" />
                                        </Note>
                                    ),
                                    callback: () => false,
                                    isRounded: true,
                                    noHover: true,
                                    separatorBefore: true,
                                },
                            ],
                        },
                    ]}
                >
                    <InvityContextDropdownButton labelTranslationId="TR_INVITY_SIGNIN_BUTTON_AUTHENTICATED" />
                </Dropdown>
            ) : (
                <InvityContextDropdownButton
                    labelTranslationId="TR_INVITY_SIGNIN_BUTTON"
                    onClick={() => handleUnauthenticatedUserButtonClick()}
                />
            )}
        </Wrapper>
    );
};

export default InvityContextDropdown;
