import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { SettingsMenu } from '@settings-components';
import { variables } from '@trezor/components';
import { MAX_WIDTH } from '@suite/constants/suite/layout';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 16px 32px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }
`;

type Props = {
    title?: string;
    children?: React.ReactNode;
    ['data-test']?: string;
};

const SettingsLayout = (props: Props) => {
    const { setLayout } = React.useContext(LayoutContext);

    React.useMemo(() => {
        if (setLayout) setLayout(props.title || 'Settings', null, <SettingsMenu />);
    }, [props.title, setLayout]);

    return (
        <>
            <Wrapper data-test={props['data-test']}>{props.children}</Wrapper>
        </>
    );
};

export default SettingsLayout;
