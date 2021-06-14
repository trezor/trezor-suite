import React from 'react';
import styled from 'styled-components';
import { Translation, TrezorLink } from '@suite-components';
import { Button } from '@trezor/components';
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
    <TrezorLink variant="nostyle" href={URLS.SHOP_URL}>
        <Button variant="tertiary" icon="TREZOR_LOGO" style={{ backgroundColor: 'initial' }}>
            <Translation id="TR_BUY_TREZOR" />
        </Button>
    </TrezorLink>
);

const HelpButton = () => (
    <TrezorLink variant="nostyle" href={URLS.WALLET_ACCESS_URL}>
        <Button variant="tertiary" icon="SUPPORT" style={{ backgroundColor: 'initial' }}>
            <Translation id="TR_HELP" />
        </Button>
    </TrezorLink>
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
