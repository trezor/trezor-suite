import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import TrezorConnect from '@trezor/connect';
import { Button } from '@trezor/components';
import {
    beginOnbordingTutorial,
    goToNextStep,
    setDeviceTutorialStatus,
} from 'src/actions/onboarding/onboardingActions';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { selectOnboardingTutorialStatus } from 'src/reducers/onboarding/onboardingReducer';
import messages from 'src/support/messages';
import { OnboardingStepBox } from '../onboarding';
import { Translation } from '../suite';
import { StyledBackdrop } from '../onboarding/OnboardingStepBox';
import { zIndices } from '@trezor/theme';

const BoxContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: -60px;

    ${StyledBackdrop} {
        z-index: ${zIndices.onboardingForeground};
    }
`;

const StyledOnboardingStepBox = styled(OnboardingStepBox)`
    padding: 40px 20px 0px 20px;
`;

const ActionButton = styled.p`
    margin: 10px auto 0;

    span {
        text-decoration: underline;
        cursor: pointer;

        :hover {
            text-decoration: none;
        }
    }
`;

export const DeviceTutorial = () => {
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const status = useSelector(selectOnboardingTutorialStatus);

    const { device } = useDevice();
    const deviceModelInternal = device?.features?.internal_model;
    const dispatch = useDispatch();
    const intl = useIntl();
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (sectionRef.current) {
            sectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [status]);

    if (!status) {
        return null;
    }

    const getHeading = () => {
        switch (status) {
            case 'active':
                return <Translation id="TR_TREZOR_DEVICE_TUTORIAL_HEADING" />;
            case 'completed':
                return <Translation id="TR_TREZOR_DEVICE_TUTORIAL_COMPLETED_HEADING" />;
            case 'cancelled':
                return <Translation id="TR_TREZOR_DEVICE_TUTORIAL_CANCELED_HEADING" />;
            // no default
        }
    };

    const getDescritpion = () => {
        switch (status) {
            case 'active':
                return (
                    <>
                        <Translation id="TR_TREZOR_DEVICE_TUTORIAL_DESCRIPTION" />
                        {isActionAbortable && (
                            <ActionButton
                                onClick={() =>
                                    TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED))
                                }
                            >
                                <Translation id="TR_SKIP" />
                            </ActionButton>
                        )}
                    </>
                );
            case 'completed':
            case 'cancelled':
                return (
                    <ActionButton onClick={() => dispatch(beginOnbordingTutorial())}>
                        <Translation id="TR_RESTART_TREZOR_DEVICE_TUTORIAL" />
                    </ActionButton>
                );
            // no default
        }
    };

    const ContinueButton = (
        <Button
            variant="primary"
            onClick={() => {
                dispatch(goToNextStep());
                dispatch(setDeviceTutorialStatus(null));
            }}
            data-test="@firmware/continue-after-tutorial-button"
        >
            <Translation id="TR_CONTINUE" />
        </Button>
    );

    const isContinueButtonVisible = ['cancelled', 'completed'].includes(status);
    const imgName =
        deviceModelInternal && (`DEVICE_CONFIRM_TREZOR_${deviceModelInternal}` as const);

    return (
        <BoxContainer ref={sectionRef}>
            <StyledOnboardingStepBox
                image={imgName}
                heading={getHeading()}
                description={getDescritpion()}
                deviceModelInternal={status === 'active' ? deviceModelInternal : undefined}
                devicePromptTitle={<Translation id="TR_CONTINUE_ON_TREZOR" />}
                outerActions={isContinueButtonVisible && ContinueButton}
            />
        </BoxContainer>
    );
};
