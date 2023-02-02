import React, { useRef } from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button, P, Range, Switch, variables } from '@trezor/components';
import { SliderInput } from '@wallet-components/PrivacyAccount/SliderInput';

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

const FeeInput = styled(SliderInput)`
    top: -6px;
    right: 0;
    width: 116px;

    input {
        height: 38px;
        padding-left: 12px;
        font-size: ${variables.FONT_SIZE.H3};
    }
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

const MiningFee = styled.section`
    position: relative;
    flex-grow: 1;
`;

const StyledSwitch = styled(Switch)`
    margin-top: 10px;
`;

interface CoinjoinCustomStrategyProps {
    maxFee: number;
    reset: () => void;
    setMaxFee: React.Dispatch<React.SetStateAction<number>>;
    setSkipRounds: React.Dispatch<React.SetStateAction<boolean>>;
    skipRounds: boolean;
}

export const CoinjoinCustomStrategy = ({
    maxFee,
    reset,
    setMaxFee,
    setSkipRounds,
    skipRounds,
}: CoinjoinCustomStrategyProps) => {
    const inputRef = useRef<{ setPreviousValue: (number: number) => void }>(null);

    const trackStyle = {
        background:
            'linear-gradient(270deg, #bf6767 0%, #c8b882 18.73%, #c8b883 36.25%, #95cda5 43.99%,#2a9649 100%)',
    };

    const handleSliderChange = (number: number) => {
        inputRef.current?.setPreviousValue(number);
        setMaxFee(number);
    };

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
                        <FeeInput
                            ref={inputRef}
                            value={maxFee}
                            min={1}
                            max={500}
                            onChange={setMaxFee}
                            innerAddon={<span>sat/vB</span>}
                            addonAlign="right"
                        />
                    </Row>
                    <MiningFeeText>
                        <Translation id="TR_MINING_FEE_NOTE" />
                    </MiningFeeText>
                    <Range
                        min={1}
                        max={500}
                        value={maxFee}
                        onChange={e => handleSliderChange(Number(e.target.value))}
                        trackStyle={trackStyle}
                        labels={[
                            { value: '1 sat/vB' },
                            { value: '250 sat/vB' },
                            { value: '500 sat/vB' },
                        ]}
                        onLabelClick={handleSliderChange}
                    />
                </MiningFee>
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
