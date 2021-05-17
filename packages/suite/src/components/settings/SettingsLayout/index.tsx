import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { SettingsMenu } from '@settings-components';
import { variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    max-width: ${variables.SCREEN_SIZE.MD};
`;

type Props = {
    title?: string;
    children?: React.ReactNode;
    ['data-test']?: string;
};

const SettingsLayout = (props: Props) => {
    const { setLayout } = React.useContext(LayoutContext);

    React.useEffect(() => {
        if (setLayout) setLayout(props.title || 'Settings', null, <SettingsMenu />);
    }, [props.title, setLayout]);

    return <Wrapper data-test={props['data-test']}>{props.children}</Wrapper>;
};

export default SettingsLayout;
