import React from 'react';
import styled from 'styled-components';
import { useLayout } from 'src/hooks/suite';
import { SettingsMenu } from 'src/components/settings';
import { variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    max-width: ${variables.SCREEN_SIZE.MD};
    margin-top: 8px;
`;

type SettingsLayoutProps = {
    title?: string;
    children?: React.ReactNode;
    ['data-test']?: string;
    className?: string;
};

export const SettingsLayout = (props: SettingsLayoutProps) => {
    useLayout(props.title || 'Settings', SettingsMenu);

    return (
        <Wrapper className={props.className} data-test={props['data-test']}>
            {props.children}
        </Wrapper>
    );
};
