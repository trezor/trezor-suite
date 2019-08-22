import React from 'react';
import { FormattedMessage } from 'react-intl';
import { H6, TrezorImage } from '@trezor/components';

import {
    goToNextStep,
    goToPreviousStep,
    selectTrezorModel,
} from '@onboarding-actions/onboardingActions';
import { Wrapper, OnboardingButton, Option } from '@onboarding-components';

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
        <Wrapper.Step>
            <Wrapper.StepHeading>
                <FormattedMessage {...l10nMessages.TR_SELECT_YOUR_DEVICE_HEADING} />
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                <Wrapper.Options>
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
                </Wrapper.Options>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <Wrapper.Controls>
                    <OnboardingButton.Back
                        onClick={() => {
                            onboardingActions.goToPreviousStep();
                        }}
                    >
                        Back
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default SelectDeviceStep;
