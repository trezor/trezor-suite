import { Translation } from '@suite-components';
import { Dropdown, DropdownRef, Icon, useTheme, variables } from '@trezor/components';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import ActionItem from '../ActionItem';
import { useActions, useAnalytics } from '@suite-hooks';
import { transparentize } from 'polished';
import * as routerActions from '@suite-actions/routerActions';

const Wrapper = styled.div<Pick<Props, 'marginLeft'>>`
    ${props => props.marginLeft && `margin-left: 8px`};
    position: relative;
`;

const TorStatus = styled.button`
    cursor: pointer;
    border: 0;
    background: none;
    display: flex;
    align-items: center;
    text-align: left;
    width: 100%;
    & > * + * {
        margin-left: 10px;
    }
`;

const Indicator = styled.div<{ isActive?: boolean }>`
    display: flex;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    position: relative;
    background: ${props =>
        props.isActive
            ? transparentize(0.9, props.theme.TYPE_GREEN)
            : transparentize(0.9, props.theme.TYPE_LIGHT_GREY)};

    &:after {
        content: '';
        position: absolute;
        top: 8px;
        left: 8px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${props =>
            props.isActive ? props.theme.TYPE_GREEN : props.theme.TYPE_LIGHT_GREY};
    }
`;

const Details = styled.div`
    display: flex;
    flex-direction: column;
`;

const Label = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const Address = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const GoToTorSettings = styled.div`
    display: flex;
    align-items: center;
    background: none;
    border: 0;
    width: 16px;
    margin: 0 10px 0 auto;
`;

interface Props {
    marginLeft?: boolean;
    isActive?: boolean;
}

const TorDropdown = (props: Props) => {
    const analytics = useAnalytics();

    const [open, setOpen] = useState(false);
    const [torAddress, setTorAddress] = useState('');
    const dropdownRef = useRef<DropdownRef>();
    const theme = useTheme();
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    useEffect(() => {
        window.desktopApi?.getTorAddress().then(address => setTorAddress(address));
    });

    return (
        <Wrapper {...props}>
            <Dropdown
                onToggle={() => {
                    setOpen(!open);
                    analytics.report({
                        type: 'menu/toggle-tor',
                        payload: {
                            value: !open,
                        },
                    });
                }}
                ref={dropdownRef}
                alignMenu="right"
                offset={34}
                horizontalPadding={12}
                topPadding={12}
                bottomPadding={12}
                minWidth={230}
                items={[
                    {
                        key: 'tor',
                        options: [
                            {
                                key: 'torStatus',
                                label: (
                                    <TorStatus
                                        onClick={() => {
                                            goto('settings-index');
                                            analytics.report({ type: 'menu/goto/tor' });
                                        }}
                                    >
                                        <Indicator isActive={props.isActive} />
                                        <Details>
                                            <Label>
                                                <Translation id="TR_TOR" />{' '}
                                                {props.isActive ? (
                                                    <Translation id="TR_ACTIVE" />
                                                ) : (
                                                    <Translation id="TR_DISABLED" />
                                                )}
                                            </Label>
                                            {props.isActive && <Address>{torAddress}</Address>}
                                        </Details>
                                        <GoToTorSettings>
                                            <Icon
                                                icon="ARROW_RIGHT"
                                                size={24}
                                                color={theme.TYPE_LIGHT_GREY}
                                            />
                                        </GoToTorSettings>
                                    </TorStatus>
                                ),
                                noPadding: true,
                                noHover: true,
                            },
                        ],
                    },
                ]}
            >
                <ActionItem
                    label={<Translation id="TR_TOR" />}
                    icon="TOR"
                    isOpen={open}
                    indicator={props.isActive ? 'check' : undefined}
                />
            </Dropdown>
        </Wrapper>
    );
};

export default TorDropdown;
