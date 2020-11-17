import React from 'react';
import styled from 'styled-components';
import HelpBuyIcons from './components/HelpBuyIcons';

const Wrapper = styled.div`
    width: 100%;
    height: 40px;
    justify-content: center;
    align-items: center;
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
    border: solid 2px ${props => props.theme.BG_LIGHT_GREY};
    width: 100%;
    bottom: 12px;
`;

const GrayBar = styled(Bar)<BarProps>`
    bottom: 6px;
    background-color: ${props => props.theme.BG_LIGHT_GREY};
    border: solid 2px ${props => props.theme.BG_LIGHT_GREY};
    width: ${props => props.width};
    z-index: 2;
    transition: all 0.5s;
`;

const GreenBar = styled(Bar)<BarProps>`
    background-color: ${props => props.theme.TYPE_GREEN};
    border: solid 2px ${props => props.theme.TYPE_GREEN};
    width: ${props => props.width};
    z-index: 3;
    transition: all 0.5s;
`;

interface Props {
    total: number;
    current: number;
    showBuy?: boolean;
    showHelp?: boolean;
    hidden?: boolean;
}

const ProgressBar = (props: Props) => {
    const { total, current, showBuy, showHelp, hidden } = props;
    const progress = (100 / total) * current;
    return (
        <Wrapper>
            {!hidden && (
                <>
                    <BarContainer>
                        <GreenBar width={`${Math.min(Math.max(progress - 5, 0), 100)}%`} />
                        <GrayBar width={`${Math.min(progress, 100)}%`} />
                        <BackgroundBar />
                    </BarContainer>
                    <HelpBuyIcons showBuy={showBuy} showHelp={showHelp} />
                </>
            )}
        </Wrapper>
    );
};

export default ProgressBar;
