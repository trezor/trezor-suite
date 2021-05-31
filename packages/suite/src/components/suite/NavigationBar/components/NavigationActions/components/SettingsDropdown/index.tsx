import { Translation } from '@suite-components';
import { Dropdown, DropdownRef } from '@trezor/components';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import ActionItem from '../ActionItem';
import { useActions, useAnalytics } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import * as guideActions from '@suite-actions/guideActions';

const Wrapper = styled.div<Pick<Props, 'marginLeft'>>`
    ${props => props.marginLeft && `margin-left: 8px`};
    position: relative;
`;

interface Props {
    marginLeft?: boolean;
    isActive?: boolean;
}

const SettingsDropdown = (props: Props) => {
    const analytics = useAnalytics();
    const reportDropdownEvent = (option: 'all' | 'general' | 'device' | 'coins') => {
        analytics.report({
            type: 'menu/settings/dropdown',
            payload: {
                option,
            },
        });
    };

    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<DropdownRef>();

    const { goto, openGuide } = useActions({
        goto: routerActions.goto,
        openGuide: guideActions.open,
    });

    return (
        <Wrapper {...props}>
            <Dropdown
                onToggle={() => {
                    setOpen(!open);
                    analytics.report({
                        type: 'menu/settings/toggle',
                        payload: { value: !open },
                    });
                }}
                ref={dropdownRef}
                alignMenu="right"
                offset={34}
                horizontalPadding={10}
                topPadding={0}
                minWidth={230}
                masterLink={{
                    callback: () => {
                        goto('settings-index');
                        reportDropdownEvent('all');
                    },
                    label: <Translation id="TR_ALL" />,
                    icon: 'ARROW_RIGHT_LONG',
                }}
                items={[
                    {
                        key: 'settings',
                        label: <Translation id="TR_SETTINGS" />,
                        options: [
                            {
                                key: '1',
                                label: <Translation id="TR_APPLICATION" />,
                                icon: 'APP',
                                callback: () => {
                                    goto('settings-index');
                                    reportDropdownEvent('general');
                                },
                                isRounded: true,
                                'data-test': '@suite/menu/settings-index',
                            },
                            {
                                key: '2',
                                label: <Translation id="TR_DEVICE" />,
                                icon: 'DEVICE',
                                callback: () => {
                                    goto('settings-device');
                                    reportDropdownEvent('device');
                                },
                                isRounded: true,
                                'data-test': '@suite/menu/settings-device',
                            },
                            {
                                key: '3',
                                label: <Translation id="TR_COINS" />,
                                icon: 'COINS',
                                callback: () => {
                                    goto('settings-coins');
                                    reportDropdownEvent('coins');
                                },
                                isRounded: true,
                                'data-test': '@suite/menu/settings-coins',
                            },
                        ],
                    },
                    {
                        key: 'guide',
                        options: [
                            {
                                key: '4',
                                label: <Translation id="TR_LEARN_AND_DISCOVER" />,
                                icon: 'LIGHTBULB',
                                iconRight: 'ARROW_RIGHT',
                                callback: () => {
                                    openGuide();
                                },
                                isRounded: true,
                                separatorBefore: true,
                            },
                        ],
                    },
                ]}
            >
                <ActionItem
                    data-test="@suite/menu/settings"
                    label={<Translation id="TR_SETTINGS" />}
                    icon="SETTINGS"
                    isOpen={open}
                    isActive={props.isActive}
                />
            </Dropdown>
        </Wrapper>
    );
};

export default SettingsDropdown;
