import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { variables } from '@trezor/components';

const Wrapper = styled.div`
    padding: 16px 32px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }
`;

const Offers = () => {
    const { setLayout } = React.useContext(LayoutContext);

    React.useMemo(() => {
        if (setLayout) setLayout(undefined, undefined);
    }, [setLayout]);

    return <Wrapper data-test="@offers/index">offers pro martina</Wrapper>;
};

export default Offers;
