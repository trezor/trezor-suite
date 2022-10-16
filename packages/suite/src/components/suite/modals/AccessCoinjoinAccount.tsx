import React, { useState } from 'react';
import styled from 'styled-components';

import { UserContextPayload } from '@suite-actions/modalActions';
import { Button, P, Image, variables, H2, H3, Warning } from '@trezor/components';
import { Modal, Translation } from '@suite-components';
import { getCoinjoinConfig } from '@suite/services/coinjoin/config';

const SmallModal = styled(Modal)`
    width: 560px;
`;

const Description = styled(P)`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    text-align: center;
`;

const DescriptionLeft = styled(Description)`
    text-align: left;
`;

const ImageContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
`;

const StyledImage = styled(Image)`
    width: auto;
    height: 150px;
`;

const StyledH2 = styled(H2)`
    margin-top: 12px;
    margin-bottom: 12px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.H2};
`;

const StyledH3 = styled(H3)`
    margin-top: 12px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.H3};
    text-align: left;
`;

const PlaceHolder = styled.div`
    width: 100%;
    height: 74px;
    background-color: #ccc;
`;

const StyledWarning = styled(Warning)`
    margin-top: 12px;
    font-size: 14px;
`;

enum Steps {
    INITIAL = 0,
    ANONYMITY_LEVEL = 1,
}

type AccessCoinjoinAccountProps = Omit<
    Extract<UserContextPayload, { type: 'access-coinjoin-account' }>,
    'type'
> & {
    onCancel: () => void;
};

export const AccessCoinjoinAccount = ({
    onCancel,
    decision,
    network,
}: AccessCoinjoinAccountProps) => {
    const { percentageFee } = getCoinjoinConfig(network);
    const [step, setStep] = useState(Steps.INITIAL);

    const onContinue = () => {
        switch (step) {
            case Steps.INITIAL:
                return setStep(currentStep => currentStep + 1);
            case Steps.ANONYMITY_LEVEL:
                // When returning `true` we successfully completed the process.
                return decision.resolve(true);
            // no default
        }
    };

    const onBackClick = () => {
        switch (step) {
            case Steps.INITIAL:
                return decision.resolve(false);
            case Steps.ANONYMITY_LEVEL:
                return setStep(currentStep => currentStep - 1);
            // no default
        }
    };

    const getStep = () => {
        switch (step) {
            case Steps.INITIAL:
                return (
                    <>
                        <ImageContainer>
                            <StyledImage image="COINJOIN_MESS" />
                        </ImageContainer>
                        <StyledH2>
                            <Translation id="TR_COINJOIN_ACCESS_ACCOUNT_STEP_INITIAL_TITLE" />
                        </StyledH2>
                        <Description>
                            <Translation id="TR_COINJOIN_ACCESS_ACCOUNT_STEP_INITIAL_DESCRIPTION" />
                        </Description>
                        <StyledWarning>
                            <Translation
                                id="TR_COINJOIN_ACCESS_ACCOUNT_STEP_INITIAL_FEE_MESSAGE"
                                values={{ fee: percentageFee }}
                            />
                        </StyledWarning>
                    </>
                );
            case Steps.ANONYMITY_LEVEL:
                return (
                    <>
                        <StyledH3>
                            <Translation id="TR_COINJOIN_ACCESS_ACCOUNT_STEP_ANONYMITY_LEVEL_TITLE" />
                        </StyledH3>
                        <DescriptionLeft>
                            <Translation id="TR_COINJOIN_ACCESS_ACCOUNT_STEP_ANONYMITY_LEVEL_DESCRIPTION" />
                        </DescriptionLeft>
                        <PlaceHolder />
                    </>
                );
            // no default
        }
    };

    return (
        <>
            <SmallModal
                isCancelable
                onCancel={onCancel}
                onBackClick={onBackClick}
                isHeadingCentered
                heading={<Translation id="TR_COINJOIN_ACCESS_ACCOUNT_TITLE" />}
                subheading={<Translation id="TR_COINJOIN_ACCESS_ACCOUNT_SUBTITLE" />}
                bottomBar={
                    <Button variant="primary" onClick={onContinue}>
                        <Translation id="TR_CONTINUE" />
                    </Button>
                }
            >
                {getStep()}
            </SmallModal>
        </>
    );
};
