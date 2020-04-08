import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { Menu } from '@settings-components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 0px 32px 32px 32px;
    padding-top: 16px;
    max-width: 1024px;
`;

type Props = {
    title?: string;
    children?: React.ReactNode;
};

const SettingsLayout = (props: Props) => {
    const { setLayout } = React.useContext(LayoutContext);
    React.useMemo(() => {
        if (setLayout) setLayout(props.title || 'Settings', <Menu />);
    }, [props.title, setLayout]);

    return <Wrapper>{props.children}</Wrapper>;
};

export default SettingsLayout;
