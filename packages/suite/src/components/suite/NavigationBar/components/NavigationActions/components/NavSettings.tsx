import { Translation } from '@suite-components';
import React from 'react';
import styled from 'styled-components';
import ActionItem from './ActionItem';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';

const Wrapper = styled.div`
    margin-left: 8px;
    position: relative;
`;

interface NavSettingsProps {
    isActive?: boolean;
}

export const NavSettings = ({ isActive }: NavSettingsProps) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper>
            <ActionItem
                data-test="@suite/menu/settings"
                label={<Translation id="TR_SETTINGS" />}
                icon="SETTINGS"
                isActive={isActive}
                onClick={() => {
                    goto('settings-index');
                }}
            />
        </Wrapper>
    );
};
