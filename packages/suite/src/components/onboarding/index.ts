import Option from './Option';
import Text from './Text';

import ControlsWrapper from './Wrapper/ControlsWrapper';
import OptionsWrapper from './Wrapper/OptionsWrapper';
import StepBodyWrapper from './Wrapper/StepBodyWrapper';
import StepFooterWrapper from './Wrapper/StepFooterWrapper';
import StepHeadingWrapper from './Wrapper/StepHeadingWrapper';
import StepWrapper from './Wrapper/StepWrapper';

import ButtonAlt from './Buttons/ButtonAlt';
import ButtonCta from './Buttons/ButtonCta';
import ButtonBack from './Buttons/ButtonBack';

import Box from './Box/Box';
import ConnectDevicePrompt from './ConnectDevicePrompt';
import WelcomeLayout from './Layouts/WelcomeLayout';
import OnboardingLayout from './Layouts/OnboardingLayout';

import Dots from './Loaders/Dots';

const OnboardingButton = {
    Alt: ButtonAlt,
    Cta: ButtonCta,
    Back: ButtonBack,
};

const Loaders = {
    Dots,
};

const Wrapper = {
    Controls: ControlsWrapper,
    Options: OptionsWrapper,
    StepBody: StepBodyWrapper,
    StepFooter: StepFooterWrapper,
    StepHeading: StepHeadingWrapper,
    Step: StepWrapper,
};

export {
    OnboardingButton,
    Loaders,
    Text,
    Wrapper,
    Option,
    Box,
    ConnectDevicePrompt,
    WelcomeLayout,
    OnboardingLayout,
};
