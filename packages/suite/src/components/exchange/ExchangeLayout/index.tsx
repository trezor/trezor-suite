import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { Menu } from '@exchange-components';
import { MAX_WIDTH } from '@suite-constants/layout';
import { variables } from '@trezor/components';

const Wrapper = styled.div<{ noPadding?: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 16px 32px 32px 32px;
    max-width: ${MAX_WIDTH};
    height: 100%;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }
`;

type Props = {
    title?: string;
    children?: React.ReactNode;
};

const ExchangeLayout = (props: Props) => {
    const { setLayout } = React.useContext(LayoutContext);
    React.useMemo(() => {
        if (setLayout) setLayout(props.title || 'Trezor Suite | Wallet', <Menu />);
    }, [props.title, setLayout]);

    return (
        <>
            <Wrapper noPadding>{props.children}</Wrapper>
        </>
    );
};

export default ExchangeLayout;
