import { ReactNode } from 'react';
import styled from 'styled-components';
import { useLayout } from 'src/hooks/suite';
import { SettingsMenu } from './SettingsMenu';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    margin-top: 8px;
`;

type SettingsLayoutProps = {
    title?: string;
    children?: ReactNode;
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
