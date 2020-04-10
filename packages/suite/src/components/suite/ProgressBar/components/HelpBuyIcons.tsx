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
    <Link variant="nostyle" href={URLS.SHOP_URL}>
        <Button
            variant="tertiary"
            icon="TREZOR"
            size="small"
            style={{ backgroundColor: 'initial' }}
        >
            Buy Trezor
        </Button>
    </Link>
);

const HelpButton = () => (
    <Link variant="nostyle" href={URLS.SUPPORT_URL}>
        <Button
            variant="tertiary"
            icon="SUPPORT"
            size="small"
            style={{ backgroundColor: 'initial' }}
        >
            Help
        </Button>
    </Link>
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
