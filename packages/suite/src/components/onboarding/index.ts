import Option from './Option';
import ProgressBar from './ProgressBar';
import Text from './Text';
import UnexpectedState from './UnexpectedState';

import CheckboxWrapper from './Wrapper/CheckboxWrapper';
import ControlsWrapper from './Wrapper/ControlsWrapper';
import OptionsWrapper from './Wrapper/OptionsWrapper';
import StepBodyWrapper from './Wrapper/StepBodyWrapper';
import StepFooterWrapper from './Wrapper/StepFooterWrapper';
import StepHeadingWrapper from './Wrapper/StepHeadingWrapper';
import StepSubHeadingWrapper from './Wrapper/StepSubHeadingWrapper';
import StepWrapper from './Wrapper/StepWrapper';

import ButtonAlt from './Buttons/ButtonAlt';
import ButtonCta from './Buttons/ButtonCta';
import ButtonBack from './Buttons/ButtonBack';

import ConnectDevice from './Icons/ConnectDevice';

import Dots from './Loaders/Dots';

const OnboardingIcon = {
    ConnectDevice,
};

const OnboardingButton = {
    Alt: ButtonAlt,
    Cta: ButtonCta,
    Back: ButtonBack,
};

const Loaders = {
    Dots,
};

const Wrapper = {
    Checkbox: CheckboxWrapper,
    Controls: ControlsWrapper,
    Options: OptionsWrapper,
    StepBody: StepBodyWrapper,
    StepFooter: StepFooterWrapper,
    StepHeading: StepHeadingWrapper,
    StepSubHeadingWrapper,
    Step: StepWrapper,
};

export {
    OnboardingButton,
    OnboardingIcon,
    Loaders,
    ProgressBar,
    Text,
    UnexpectedState,
    Wrapper,
    Option,
};
