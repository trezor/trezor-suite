import Option from './Option';
import NeueOption, { OptionsWrapper, OptionWrapper, OptionsDivider } from './NeueOption';
import Text from './Text';

import ControlsWrapper from './Wrapper/ControlsWrapper';
// import OptionsWrapper from './Wrapper/OptionsWrapper';
import StepBodyWrapper from './Wrapper/StepBodyWrapper';
import StepFooterWrapper from './Wrapper/StepFooterWrapper';
import StepHeadingWrapper from './Wrapper/StepHeadingWrapper';
import StepWrapper from './Wrapper/StepWrapper';

import ButtonAlt from './Buttons/ButtonAlt';
import ButtonCta from './Buttons/ButtonCta';
import ButtonBack from './Buttons/ButtonBack';
import ButtonSkip from './Buttons/ButtonSkip';

import Box, { BoxProps } from './Box/Box';
import ConnectDevicePrompt from './ConnectDevicePrompt';
import ConnectDevicePromptManager from './ConnectDevicePromptManager';
import OnboardingLayout from './Layouts/OnboardingLayout';
import WelcomeLayout from './Layouts/WelcomeLayout';
import ProgressBar from './ProgressBar';
import Hologram from './Hologram';
import TroubleshootingTips from './TroubleshootingTips';
import Dots from './Loaders/Dots';

const OnboardingButton = {
    Alt: ButtonAlt,
    Cta: ButtonCta,
    Back: ButtonBack,
    Skip: ButtonSkip,
};

const Loaders = {
    Dots,
};

const Wrapper = {
    // TODO: remove what we don't need anymore
    Controls: ControlsWrapper,
    Options: OptionsWrapper,
    StepBody: StepBodyWrapper,
    StepFooter: StepFooterWrapper,
    StepHeading: StepHeadingWrapper,
    Step: StepWrapper,
};

// TODO: remove what we don't need anymore
export {
    OnboardingButton,
    Loaders,
    Text,
    Wrapper,
    Option,
    NeueOption,
    OptionsWrapper,
    OptionWrapper,
    OptionsDivider,
    Box,
    ConnectDevicePrompt,
    ConnectDevicePromptManager,
    WelcomeLayout,
    OnboardingLayout,
    ProgressBar,
    TroubleshootingTips,
    Hologram,
};
export type { BoxProps };
