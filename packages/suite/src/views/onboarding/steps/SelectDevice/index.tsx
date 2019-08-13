import React from 'react';
import { FormattedMessage } from 'react-intl';
import { H6, TrezorImage } from '@trezor/components';

import Option from '@onboarding-components/Option';
import Text from '@onboarding-components/Text';
import { ButtonBack } from '@suite/components/onboarding/Buttons';
import {
    StepWrapper,
    StepHeadingWrapper,
    StepBodyWrapper,
    StepFooterWrapper,
    OptionsWrapper,
    ControlsWrapper,
} from '@onboarding-components/Wrapper';
import {
    goToNextStep,
    goToPreviousStep,
    selectTrezorModel,
} from '@onboarding-actions/onboardingActions';

import l10nMessages from './index.messages';

const DEVICE_HEIGHT = 130;

interface Props {
    onboardingActions: {
        selectTrezorModel: typeof selectTrezorModel;
        goToNextStep: typeof goToNextStep;
        goToPreviousStep: typeof goToPreviousStep;
    };
}

const SelectDeviceStep: React.FC<Props> = ({ onboardingActions }) => {
    return (
        <StepWrapper>
            <StepHeadingWrapper>
                <FormattedMessage {...l10nMessages.TR_SELECT_YOUR_DEVICE_HEADING} />
            </StepHeadingWrapper>
            <StepBodyWrapper>
                <Text>Note -> isnt it nicer without the green buttons?</Text>

                <OptionsWrapper>
                    <Option
                        data-test="option-model-one-path"
                        onClick={() => {
                            onboardingActions.selectTrezorModel(1);
                            onboardingActions.goToNextStep();
                        }}
                    >
                        <TrezorImage style={{ margin: '15px' }} model={1} height={DEVICE_HEIGHT} />
                        <H6>
                            <FormattedMessage {...l10nMessages.TR_MODEL_ONE} />
                        </H6>
                    </Option>
                    <Option
                        data-test="option-model-t-path"
                        onClick={() => {
                            onboardingActions.selectTrezorModel(2);
                            onboardingActions.goToNextStep();
                        }}
                    >
                        <TrezorImage style={{ margin: '15px' }} model={2} height={DEVICE_HEIGHT} />
                        <H6>
                            <FormattedMessage {...l10nMessages.TR_MODEL_T} />
                        </H6>
                    </Option>
                </OptionsWrapper>
            </StepBodyWrapper>
            <StepFooterWrapper>
                <ControlsWrapper>
                    <ButtonBack onClick={() => onboardingActions.goToPreviousStep()}>
                        Back
                    </ButtonBack>
                </ControlsWrapper>
            </StepFooterWrapper>
        </StepWrapper>
    );
};

export default SelectDeviceStep;
