import { Translation } from '@suite-components';
import { Dropdown, DropdownRef, Icon, useTheme, variables } from '@trezor/components';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import ActionItem from '../ActionItem';
import { useActions, useAnalytics } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';

const Wrapper = styled.div<Pick<Props, 'marginLeft'>>`
    ${props => props.marginLeft && `margin-left: 8px`};
    position: relative;
`;

const Status = styled.button`
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

const Details = styled.div`
    display: flex;
    flex-direction: column;
`;

const Label = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const GoToSettings = styled.div`
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

const EarlyAccessDropdown = (props: Props) => {
    const analytics = useAnalytics();

    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<DropdownRef>();
    const theme = useTheme();
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper {...props}>
            <Dropdown
                onToggle={() => {
                    setOpen(!open);
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
                        key: 'early-access',
                        options: [
                            {
                                key: 'early-access-status',
                                label: (
                                    <Status
                                        onClick={() => {
                                            goto('settings-index');
                                            analytics.report({ type: 'menu/goto/early-access' });
                                        }}
                                    >
                                        <Details>
                                            <Label>
                                                <Translation id="TR_EARLY_ACCESS_MENU_STATUS" />{' '}
                                            </Label>
                                        </Details>
                                        <GoToSettings>
                                            <Icon
                                                icon="ARROW_RIGHT"
                                                size={24}
                                                color={theme.TYPE_LIGHT_GREY}
                                            />
                                        </GoToSettings>
                                    </Status>
                                ),
                                noPadding: true,
                                noHover: true,
                            },
                        ],
                    },
                ]}
            >
                <ActionItem
                    label={<Translation id="TR_EARLY_ACCESS_MENU" />}
                    icon="EXPERIMENTAL_FEATURES"
                    isOpen={open}
                />
            </Dropdown>
        </Wrapper>
    );
};

export default EarlyAccessDropdown;
