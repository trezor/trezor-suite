import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { ActionItem, IndicatorStatus } from './ActionItem';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { SettingsAnchor } from '@suite-constants/anchors';

const Wrapper = styled.div`
    position: relative;
    margin-left: 8px;
`;

interface NavTorProps {
    indicator?: IndicatorStatus;
}

export const NavTor = ({ indicator }: NavTorProps) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper>
            <ActionItem
                label={<Translation id="TR_TOR" />}
                icon="TOR"
                indicator={indicator}
                onClick={() => goto('settings-index', { anchor: SettingsAnchor.Tor })}
            />
        </Wrapper>
    );
};
