import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { selectDevice } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { Button } from '@trezor/components';

import {
    beginOnboardingTutorial,
    goToNextStep,
    setDeviceTutorialStatus,
} from 'src/actions/onboarding/onboardingActions';
import { OnboardingStepBox } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { selectOnboardingTutorialStatus } from 'src/reducers/onboarding/onboardingReducer';
import messages from 'src/support/messages';

const StyledOnboardingStepBox = styled(OnboardingStepBox)`
    padding: 40px 20px 0;
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
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();
    const intl = useIntl();

    const deviceModelInternal = device?.features?.internal_model;
    const isContinueButtonVisible = status && ['cancelled', 'completed'].includes(status);
    const imgName =
        deviceModelInternal && (`DEVICE_CONFIRM_TREZOR_${deviceModelInternal}` as const);
    const showDevicePrompt = status === 'active';

    const handleContinue = () => {
        dispatch(goToNextStep());
        dispatch(setDeviceTutorialStatus(null));
    };

    useEffect(() => {
        if (!status) {
            dispatch(beginOnboardingTutorial());
        }
    }, [dispatch, status]);

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
    const getDescription = () => {
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
                    <ActionButton onClick={() => dispatch(beginOnboardingTutorial())}>
                        <Translation id="TR_RESTART_TREZOR_DEVICE_TUTORIAL" />
                    </ActionButton>
                );
            // no default
        }
    };

    return (
        <StyledOnboardingStepBox
            image={imgName}
            heading={getHeading()}
            description={getDescription()}
            device={device}
            disableConfirmWrapper={!showDevicePrompt}
            devicePromptTitle={<Translation id="TR_CONTINUE_ON_TREZOR" />}
            outerActions={
                isContinueButtonVisible && (
                    <Button variant="primary" onClick={handleContinue}>
                        <Translation id="TR_CONTINUE" />
                    </Button>
                )
            }
        />
    );
};
