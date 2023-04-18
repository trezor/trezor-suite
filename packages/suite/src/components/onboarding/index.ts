import { Option, OptionsWrapper, OptionWrapper, OptionsDivider } from './Option';

import OnboardingButtonAlt from './Buttons/ButtonAlt';
import OnboardingButtonCta from './Buttons/ButtonCta';
import OnboardingButtonBack from './Buttons/ButtonBack';
import OnboardingButtonSkip from './Buttons/ButtonSkip';

import { ConnectDevicePromptManager } from './ConnectDevicePromptManager';
import { OnboardingLayout } from './Layouts/OnboardingLayout';
import { Hologram } from './Hologram';
import { DeviceAnimation, type DeviceAnimationType } from './DeviceAnimation';
import { OnboardingStepBox, type OnboardingStepBoxProps } from './OnboardingStepBox';
import SkipStepConfirmation from './SkipStepConfirmation';
import { ProgressBar } from './ProgressBar';

export {
    OnboardingButtonAlt,
    OnboardingButtonCta,
    OnboardingButtonBack,
    OnboardingButtonSkip,
    Option,
    OptionsWrapper,
    OptionWrapper,
    OptionsDivider,
    ConnectDevicePromptManager,
    OnboardingLayout,
    Hologram,
    DeviceAnimation,
    OnboardingStepBox,
    SkipStepConfirmation,
    ProgressBar,
};

export type { DeviceAnimationType, OnboardingStepBoxProps };
