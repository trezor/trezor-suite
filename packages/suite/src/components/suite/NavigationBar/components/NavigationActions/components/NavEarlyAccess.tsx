import React from 'react';
import styled from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from '@suite-components';
import { ActionItem } from './ActionItem';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { SettingsAnchor } from '@suite-constants/anchors';

const Wrapper = styled.div`
    margin-left: 8px;
    position: relative;
`;

interface NavEarlyAccessProps {
    marginLeft?: boolean;
    isActive?: boolean;
}

export const NavEarlyAccess = (props: NavEarlyAccessProps) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper {...props}>
            <ActionItem
                label={<Translation id="TR_EARLY_ACCESS_MENU" />}
                icon="EXPERIMENTAL_FEATURES"
                onClick={() => {
                    goto('settings-index', { anchor: SettingsAnchor.EarlyAccess });
                    analytics.report({ type: EventType.MenuGotoEarlyAccess });
                }}
            />
        </Wrapper>
    );
};
