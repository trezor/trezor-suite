import Option, { OptionsWrapper, OptionWrapper, OptionsDivider } from './Option';
import Text from './Text';

import OnboardingButtonAlt from './Buttons/ButtonAlt';
import OnboardingButtonCta from './Buttons/ButtonCta';
import OnboardingButtonBack from './Buttons/ButtonBack';
import OnboardingButtonSkip from './Buttons/ButtonSkip';

import Box, { BoxProps } from './Box/Box';
import ConnectDevicePromptManager from './ConnectDevicePromptManager';
import OnboardingLayout from './Layouts/OnboardingLayout';
import ProgressBar from './ProgressBar';
import Hologram from './Hologram';
import DeviceAnimation, { DeviceAnimationType } from './DeviceAnimation';
import OnboardingStepBox, { OnboardingStepBoxProps } from './OnboardingStepBox';
import SkipStepConfirmation from './SkipStepConfirmation';

export {
    OnboardingButtonAlt,
    OnboardingButtonCta,
    OnboardingButtonBack,
    OnboardingButtonSkip,
    Text,
    Option,
    OptionsWrapper,
    OptionWrapper,
    OptionsDivider,
    Box,
    ConnectDevicePromptManager,
    OnboardingLayout,
    ProgressBar,
    Hologram,
    DeviceAnimation,
    OnboardingStepBox,
    SkipStepConfirmation,
};
export type { BoxProps, DeviceAnimationType, OnboardingStepBoxProps };
