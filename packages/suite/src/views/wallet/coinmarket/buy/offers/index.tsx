import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { variables, P } from '@trezor/components';
import { useSelector } from '@suite/hooks/suite';

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

    const quotes = useSelector(state => state.wallet.coinmarket.quotes);

    return (
        <Wrapper data-test="@offers/index">
            Offers:
            <br />
            {quotes.map(q => (
                <P>
                    {q.exchange}, {q.receiveStringAmount} {q.receiveCurrency}, {q.paymentMethod}
                </P>
            ))}
        </Wrapper>
    );
};

export default Offers;
