import { Button, Dropdown, DropdownRef, variables, ButtonProps } from '@trezor/components';
import React, { useRef, useCallback, useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { darken } from 'polished';
import { withCoinmarketAuthentication } from '../hocs/withCoinmarketAuthentication';
import { useSelector } from '@suite-hooks';
import { resolveStaticPath } from '@suite/utils/suite/build';

const Wrapper = styled.div`
    margin-left: 12px;
    margin-right: 12px;
`;

interface StyledButtonProps extends ButtonProps {
    isAuthenticated: boolean;
}

// TODO: extract somewhere?
const InvityPrimaryColor = 'rgb(0, 191, 217)';
const InvityPrimaryBackbgroundColor = 'rgba(0, 191, 217, 0.05)';

// TODO: The button is not properly designed. Need to wait until designer designs the button by design manual correctly.
const StyledButton = styled(Button)<StyledButtonProps>`
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${InvityPrimaryColor};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    white-space: nowrap;
    margin-left: 10px;
    height: 32px;
    background: ${InvityPrimaryBackbgroundColor};
    &:hover,
    &:visited,
    &:focus,
    &:active {
        background: ${props =>
            darken(props.theme.HOVER_DARKEN_FILTER, InvityPrimaryBackbgroundColor)};
    }
`;

const Note = styled.div`
    padding: 7px;
    background: ${props => props.theme.STROKE_GREY};
    opacity: 0.4;
    border-radius: 5px;
`;

const Image = styled.img`
    height: 12px;
    object-fit: contain;
    margin-right: 8px;
`;

const InvityContextDropdown = () => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<DropdownRef>();
    const { invityAuthentication } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
    }));
    const isAuthenticated = !!invityAuthentication?.verified;
    const handleToggleChange = useCallback(
        (isToggled: boolean) => {
            if (isAuthenticated) {
                setOpen(isToggled);
            } else {
                // TODO: Redirect to savings deciding page with Login and Register button
            }
        },
        [isAuthenticated],
    );

    return (
        <Wrapper>
            <Dropdown
                onToggle={() => handleToggleChange(!open)}
                ref={dropdownRef}
                alignMenu="right"
                horizontalPadding={6}
                topPadding={0}
                minWidth={230}
                isDisabled={!isAuthenticated}
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
                                label: <Translation id="TR_INVITY_SIGNIN_DROPDOWN_MENU_SIGNOUT" />,
                                callback: () => {
                                    // TODO: logout
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
                <StyledButton size={14} type="button" isAuthenticated={isAuthenticated}>
                    <Image src={resolveStaticPath('/images/svg/invity-symbol.svg')} />
                    <Translation
                        id={
                            isAuthenticated
                                ? 'TR_INVITY_SIGNIN_BUTTON_AUTHENTICATED'
                                : 'TR_INVITY_SIGNIN_BUTTON'
                        }
                    />
                </StyledButton>
            </Dropdown>
        </Wrapper>
    );
};

export default withCoinmarketAuthentication(InvityContextDropdown);
