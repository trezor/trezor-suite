import React from 'react';
import styled from 'styled-components';
import { Button, Link } from '@trezor/components-v2';
import { URLS } from '@suite-constants';

const Wrapper = styled.div`
    width: 100%;
    height: 6px;
    justify-content: center;
    align-items: center;
    margin-bottom: 40px;
`;

const BarContainer = styled.div``;

const Bar = styled.div`
    height: 6px;
    position: relative;
    border-radius: 5px;
`;

interface BarProps {
    width: string;
}

const BackgroundBar = styled(Bar)`
    background-color: initial;
    border: solid 2px #ebebeb;
    width: 100%;
    bottom: 12px;
`;

const GrayBar = styled(Bar)<BarProps>`
    bottom: 6px;
    background-color: #ebebeb;
    border: solid 2px #ebebeb;
    width: ${props => props.width};
    z-index: 2;
`;

const GreenBar = styled(Bar)<BarProps>`
    /* top: 12px; */
    background-color: #30c100;
    border: solid 2px #30c100;
    width: ${props => props.width};
    z-index: 3;
`;

const IconsContainer = styled.div`
    margin: 20px 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

interface Props {
    total: number;
    current: number;
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

const ProgressBar = (props: Props) => {
    const { total, current, showBuy, showHelp } = props;
    const progress = (100 / total) * current;
    return (
        <Wrapper>
            <BarContainer>
                <GreenBar width={`${Math.min(Math.max(progress - 5, 0), 100)}%`} />
                <GrayBar width={`${Math.min(progress, 100)}%`} />
                <BackgroundBar />
            </BarContainer>
            <IconsContainer>
                {showBuy ? <BuyButton /> : <div />}
                {showHelp ? <HelpButton /> : <div />}
            </IconsContainer>
        </Wrapper>
    );
};

export default ProgressBar;
