import React from 'react';
import styled from 'styled-components';

import steps from '@onboarding-config/steps';
import { AppState } from '@suite-types';

const Wrapper = styled.div`
    width: 100%;
    height: 30px;
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
    border: solid 2px #ebebeb;
    width: 100%;
`;

const GrayBar = styled(Bar)<BarProps>`
    top: 6px;
    background-color: #ebebeb;
    border: solid 2px #ebebeb;
    width: ${props => props.width};
    z-index: 2;
`;

const GreenBar = styled(Bar)<BarProps>`
    top: 12px;
    background-color: #30c100;
    border: solid 2px #30c100;
    width: ${props => props.width};
    z-index: 3;
`;

interface Props {
    activeStepId: AppState['onboarding']['activeStepId'];
}

const ProgressBar = (props: Props) => {
    const { activeStepId } = props;

    const activeStepIndex = steps.findIndex(step => activeStepId === step.id);
    let progress = (100 / steps.filter(s => s.progress).length) * activeStepIndex;
    if (activeStepIndex === steps.length) {
        progress = 100;
    }

    return (
        <Wrapper>
            <BarContainer>
                <GreenBar width={`${Math.min(progress - 5, 100)}%`} />
                <GrayBar width={`${Math.min(progress, 100)}%`} />
                <BackgroundBar />
            </BarContainer>
        </Wrapper>
    );
};

export default ProgressBar;
