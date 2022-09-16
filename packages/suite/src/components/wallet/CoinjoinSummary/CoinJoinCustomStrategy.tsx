import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import { Translation } from '@suite-components';
import { Button, P, Switch, variables } from '@trezor/components';
import { CoinjoinSessionDetail } from './CoinjoinSessionDetail';

const Row = styled.div`
    display: flex;
    justify-content: space-between;
`;

const TopRow = styled(Row)`
    align-items: center;
    margin-bottom: 20px;
`;

const MiddleRow = styled(Row)`
    align-items: flex-start;
    gap: 36px;
    margin: 4px 0;
`;

const BottomRow = styled(Row)`
    gap: 12px;
    margin-top: 16px;
`;

const Heading = styled.div`
    font-size: ${variables.FONT_SIZE.H3};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const SetupHeading = styled(Heading)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Fee = styled(Heading)`
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

const Subheading = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 3px;
`;

const Text = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const MiningFeeText = styled(Text)`
    margin-top: 12px;
`;

const Mark = styled(Text)`
    font-size: ${variables.FONT_SIZE.TINY};
`;

const LeftMark = styled(Mark)`
    flex: 1 1 33%;
`;

const MiddleMark = styled(Mark)`
    flex: 1 1 33.5%;
    text-align: center;
`;

const RightMark = styled(Mark)`
    flex: 1 1 33.5%;
    text-align: right;
`;

const MiningFee = styled.section`
    flex-grow: 1;
`;

const sliderTrack = css`
    background: linear-gradient(
        270deg,
        #bf6767 0%,
        #c8b882 18.73%,
        #c8b883 36.25%,
        #95cda5 43.99%,
        #2a9649 100%
    );
    cursor: pointer;
    height: 3px;
`;
const sliderThumb = css`
    appearance: none;
    background: ${({ theme }) => theme.BG_WHITE};
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 50%;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
    cursor: grab;
    height: 26px;
    margin-top: -12px;
    width: 26px;

    :active {
        box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2);
        cursor: grabbing;
    }
`;

const Range = styled.input`
    appearance: none;
    margin: 30px 0 12px 0;
    vertical-align: top; /* prevent extra bottom space in Firefox */
    width: 100%;

    ::-webkit-slider-runnable-track {
        ${sliderTrack}
    }
    ::-webkit-slider-thumb {
        ${sliderThumb}
    }
    ::-moz-range-track {
        ${sliderTrack}
    }
    ::-moz-range-thumb {
        ${sliderThumb}
    }
`;

const DetailWrapper = styled.section`
    background: ${({ theme }) => theme.BG_GREY};
    border-radius: 4px;
    min-width: 260px;
    padding: 16px;
`;

const DetailHeading = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 16px;
    text-transform: uppercase;
`;

const StyledSwitch = styled(Switch)`
    margin-top: 10px;
`;

interface CoinjoinCustomStrategyProps {
    reset: () => void;
}

export const CoinjoinCustomStrategy = ({ reset }: CoinjoinCustomStrategyProps) => {
    const [maxFee, setMaxFee] = useState(3);
    const [skipRounds, setSkipRounds] = useState(true);

    const handleSliderChange: React.ChangeEventHandler<HTMLInputElement> = e =>
        setMaxFee(Number(e.target.value));
    const toggleSkipRounds = () => setSkipRounds(!skipRounds);

    return (
        <>
            <TopRow>
                <SetupHeading>
                    <Translation id="TR_CUSTOM_SETUP" />
                </SetupHeading>
                <Button variant="tertiary" icon="REFRESH" onClick={reset}>
                    <Translation id="TR_RESET_TO_DEFAULT" />
                </Button>
            </TopRow>
            <MiddleRow>
                <MiningFee>
                    <Row>
                        <Heading>
                            <Translation id="TR_MAX_MINING_FEE" />
                        </Heading>
                        <Fee>{maxFee} sat/vB</Fee>
                    </Row>
                    <MiningFeeText>
                        <Translation id="TR_MINING_FEE_NOTE" />
                    </MiningFeeText>
                    {/* TODO: separate Range component */}
                    <Range type="range" min={1} value={maxFee} onChange={handleSliderChange} />
                    <Row>
                        <LeftMark>1 sat/vB</LeftMark>
                        <MiddleMark>50 sat/vB</MiddleMark>
                        <RightMark>100 sat/vB</RightMark>
                    </Row>
                </MiningFee>
                <DetailWrapper>
                    <DetailHeading>
                        <Translation id="TR_OVERVIEW" />
                    </DetailHeading>
                    <CoinjoinSessionDetail
                        maxRounds={15}
                        maxFee={maxFee}
                        hours={[2, 4]}
                        skipRounds={skipRounds ? [4, 5] : null}
                    />
                </DetailWrapper>
            </MiddleRow>
            <Heading>
                <Translation id="TR_SKIP_ROUNDS" />
            </Heading>
            <BottomRow>
                <StyledSwitch isChecked={skipRounds} onChange={toggleSkipRounds} />
                <div>
                    <Subheading>
                        <Translation id="TR_SKIP_ROUNDS_HEADING" />
                    </Subheading>
                    <Text>
                        <Translation id="TR_SKIP_ROUNDS_DESCRIPTION" />
                    </Text>
                </div>
            </BottomRow>
        </>
    );
};
