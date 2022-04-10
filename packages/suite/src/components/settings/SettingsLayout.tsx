import React, { useEffect } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { SettingsMenu } from '@settings-components';
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
    const { setLayout } = React.useContext(LayoutContext);

    useEffect(() => {
        if (setLayout) setLayout(props.title || 'Settings', null, <SettingsMenu />);
    }, [props.title, setLayout]);

    return (
        <Wrapper className={props.className} data-test={props['data-test']}>
            {props.children}
        </Wrapper>
    );
};
