// step components
// these are exported as objects. They have properties:
// Heading  (optional)   - typically used as prop in Modal
// Body                  - main content of the component, always present
// BottomBar (optional)  - containing buttons, typically used as prop in Modal
export { InitialStep } from './Initial';
export { OnboardingInitialStep } from './OnboardingInitial';
export { CheckSeedStep } from './CheckSeed';
export { FirmwareProgressStep } from './FirmwareProgress';
export { PartiallyDoneStep } from './PartiallyDone';
export { DoneStep } from './Done';
export { ReconnectInBootloaderStep } from './ReconnectInBootloader';
export { ReconnectInNormalStep } from './ReconnectInNormal';

// exception states components
export { ErrorStep } from './Error';
export { NoNewFirmware } from './NoNewFirmware';

// styled components
export { Fingerprint } from './Fingerprint';

// container components
export { Buttons } from './Buttons';

// proxy components
export { RetryButton, ContinueButton, InstallButton, CloseButton, ConfirmButton } from './Button';
export {
    InitImg,
    SuccessImg,
    ErrorImg,
    DisconnectImg,
    WarningImg,
    ConnectInNormalImg,
    ConnectInBootloaderImg,
    SeedImg,
} from './Img';
// todo: this should be unified in @trezor/components.
//  When done, implementations of this export should be changed to {P, H1, H2} from @trezor/components
export { P, H1, H2 } from './Typography';
