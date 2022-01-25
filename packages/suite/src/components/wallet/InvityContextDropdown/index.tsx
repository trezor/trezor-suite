import { Dropdown, DropdownRef } from '@trezor/components';
import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { InvityContextDropdownButton } from './components/InvityContextDropdownButton';
import invityAPI from '@suite-services/invityAPI';

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

const InvisibleIframe = styled.iframe`
    display: none;
`;

const InvityContextDropdown = () => {
    const [open, setOpen] = useState(false);
    const [logoutUrl, setLogoutUrl] = useState<string>();
    const { invityAuthentication } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
    }));
    // TODO: Sometimes react warning pops up in console with misused ref?
    const dropdownRef = useRef<DropdownRef>();
    const handleToggleChange = useCallback((isToggled: boolean) => {
        setOpen(isToggled);
    }, []);
    const isAuthenticated = !!invityAuthentication?.verified;

    // Will be used later (after DCA for Invity features)
    // const { navigateToInvityLogin } = useInvityNavigation(selectedAccount.account);
    // const handleUnauthenticatedUserButtonClick = useCallback(() => {
    //     navigateToInvityLogin();
    // }, [navigateToInvityLogin]);

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
                                    callback: async () => {
                                        const logoutUrl = await invityAPI.logout();
                                        setLogoutUrl(logoutUrl);
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
                <></>
                // Will be used later (after DCA for Invity features)
                // <InvityContextDropdownButton
                //     labelTranslationId="TR_INVITY_SIGNIN_BUTTON"
                //     onClick={() => handleUnauthenticatedUserButtonClick()}
                // />
            )}
            {logoutUrl && (
                <InvisibleIframe
                    title="logout"
                    frameBorder="0"
                    width="0"
                    height="0"
                    src={logoutUrl}
                    sandbox="allow-scripts allow-forms allow-same-origin"
                />
            )}
        </Wrapper>
    );
};

export default InvityContextDropdown;
