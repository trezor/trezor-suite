import React from 'react';
import styled from 'styled-components';
import { Button, Link } from '@trezor/components';
import { URLS } from '@suite-constants';

const IconsContainer = styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
`;

interface Props {
    showBuy?: boolean;
    showHelp?: boolean;
}

const BuyButton = () => (
    <Button variant="tertiary" icon="TREZOR" size="small" style={{ backgroundColor: 'initial' }}>
        <Link variant="nostyle" href={URLS.SHOP_URL}>
            Buy Trezor
        </Link>
    </Button>
);

const HelpButton = () => (
    <Button variant="tertiary" icon="SUPPORT" size="small" style={{ backgroundColor: 'initial' }}>
        <Link variant="nostyle" href={URLS.SUPPORT_URL}>
            Help
        </Link>
    </Button>
);

const HelpBuyIcons = (props: Props) => {
    const { showBuy, showHelp } = props;
    return (
        <IconsContainer>
            {showBuy ? <BuyButton /> : <div />}
            {showHelp ? <HelpButton /> : <div />}
        </IconsContainer>
    );
};

export default HelpBuyIcons;
