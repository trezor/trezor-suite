import BlindMatrix from './BlindMatrix';
import Key from './Key';
import Option from './Option';
import PinMatrix from './PinMatrix';
import Preloader from './Preloader';
import ProgressSteps from './ProgressSteps';
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
import SocialLogo from './Icons/SocialLogo';

import Dots from './Loaders/Dots';
import Donut from './Loaders/Donut';

import ConnectPrompt from './Prompts/ConnectPrompt';

const OnboardingIcon = {
    ConnectDevice,
    SocialLogo,
};

const OnboardingButton = {
    Alt: ButtonAlt,
    Cta: ButtonCta,
    Back: ButtonBack,
};

const Loaders = {
    Donut,
    Dots,
};

const Prompts = {
    ConnectPrompt,
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
    BlindMatrix,
    OnboardingButton,
    OnboardingIcon,
    Key,
    Loaders,
    PinMatrix,
    Preloader,
    ProgressSteps,
    Prompts,
    Text,
    UnexpectedState,
    Wrapper,
    Option,
};
