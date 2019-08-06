import React from 'react';
import styled from 'styled-components';
import { H6, TrezorImage } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { OptionsList } from '@suite/components/onboarding/Options';
import {
    StepWrapper,
    StepHeadingWrapper,
    StepBodyWrapper,
} from '@suite/components/onboarding/Wrapper';
import { goToNextStep, selectTrezorModel } from '@suite/actions/onboarding/onboardingActions';

import l10nMessages from './index.messages';
import { AppState } from '@suite-types';

const OptionWrapper = styled.div`
    text-align: center;
`;

const DEVICE_HEIGHT = 130;

interface Props {
    onboardingActions: {
        selectTrezorModel: typeof selectTrezorModel;
        goToNextStep: typeof goToNextStep;
    };
    device: AppState['onboarding']['connect']['device'];
    model: AppState['onboarding']['selectedModel'];
}

const SelectDeviceStep: React.FC<Props> = ({ onboardingActions, model, device }) => {
    const actualVersion =
        device && device.features && device.features.major_version
            ? device.features.major_version
            : null;

    return (
        <StepWrapper>
            <StepHeadingWrapper>
                <FormattedMessage {...l10nMessages.TR_SELECT_YOUR_DEVICE_HEADING} />
            </StepHeadingWrapper>
            <StepBodyWrapper>
                <OptionsList
                    options={[
                        {
                            content: (
                                <OptionWrapper data-test="select-device-1">
                                    <TrezorImage
                                        style={{ margin: '15px' }}
                                        model={1}
                                        height={DEVICE_HEIGHT}
                                    />
                                    <H6>
                                        <FormattedMessage {...l10nMessages.TR_MODEL_ONE} />
                                    </H6>
                                </OptionWrapper>
                            ),
                            value: 1,
                            key: 1,
                        },
                        {
                            content: (
                                <OptionWrapper data-test="select-device-2">
                                    <TrezorImage
                                        style={{ margin: '15px' }}
                                        model={2}
                                        height={DEVICE_HEIGHT}
                                    />
                                    <H6>
                                        <FormattedMessage {...l10nMessages.TR_MODEL_T} />
                                    </H6>
                                </OptionWrapper>
                            ),
                            value: 2,
                            key: 2,
                        },
                    ]}
                    selected={actualVersion || model}
                    onSelect={(value: number) => {
                        onboardingActions.selectTrezorModel(value);
                        onboardingActions.goToNextStep();
                    }}
                />
            </StepBodyWrapper>
        </StepWrapper>
    );
};

export default SelectDeviceStep;
