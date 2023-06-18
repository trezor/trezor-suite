import React from 'react';
import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import { ActionItem, IndicatorStatus } from './ActionItem';
import { useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

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
