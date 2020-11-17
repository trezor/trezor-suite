import React from 'react';
import styled, { css } from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';

const PATH = 'images/svg';

const IMAGES = {
    RECOVERY_ADVANCED: 'recovery-advanced.svg',
    RECOVERY_BASIC: 'recovery-basic.svg',
    FIRMWARE_INIT_1: 'firmware-init-1.svg',
    FIRMWARE_INIT_2: 'firmware-init-2.svg',
    FIRMWARE_SUCCESS_1: 'firmware-success-1.svg',
    FIRMWARE_SUCCESS_2: 'firmware-success-2.svg',
    ALL_DONE_1: 'all-done-1.svg',
    ALL_DONE_2: 'all-done-2.svg',
    BRIDGE_QUESTION: 'bridge-question.svg', // todo: not used
    BRIDGE_SUCCESS: 'bridge-success.svg', // todo: not used
    CONFRIM_ON_DEVICE_2: 'confirm-on-device-2.svg', // todo: not used
    CREATE_NEW: 'create-new.svg',
    EXISTING_USER: 'existing-user.svg',
    HOLOGRAM_WARNING: 'hologram-warning.svg', // todo: not used
    MODEL_1: 'model-1.svg',
    MODEL_2: 'model-2.svg',
    NEW_DEVICE: 'new-device.svg',
    NEW_USER: 'new-user.svg',
    RECOVER_FROM_SEED: 'recover-from-seed.svg',
    SEED_CARD_SHAMIR: 'seed-card-shamir.svg',
    SEED_CARD_SINGLE: 'seed-card-single.svg',
    DEVICE_INITIALIZED_1: 'device-initialized-1.svg',
    DEVICE_INITIALIZED_2: 'device-initialized-2.svg',
    PIN_ASK_1: 'pin-ask-1.svg',
    PIN_ASK_2: 'pin-ask-2.svg',
    PIN_SUCCESS_1: 'pin-success-1.svg',
    PIN_SUCCESS_2: 'pin-success-2.svg',
    USED_DEVICE: 'used-device.svg',
    WRITING_SEED: 'writing-seed.svg', // todo: not used
    '12_WORDS': '12-words.svg',
    '18_WORDS': '18-words.svg',
    '24_WORDS': '24-words.svg',
    EMPTY_DASHBOARD: 'empty-dashboard.svg',
    EMPTY_WALLET: 'wallet-empty.svg',
    ANALYTICS: 'analytics.svg',
    WELCOME: 'welcome.svg',
    UNI_ERROR: 'uni-error.svg',
    UNI_SUCCESS: 'uni-success.svg',
    UNI_WARNING: 'uni-warning.svg',
    UNI_EMPTY_PAGE: 'uni-empty-page.svg',
    TUNKNOWN: 'TUnknown.svg', // todo: use in device icons
    T1: 'T1.svg',
    T2: 'T2.svg',
    T_BRIDGE_CONFIRM: 't-bridge-confirm.svg', // todo: not used
    T_BRIDGE_CHECK: 't-bridge-check.svg',
    SPINNER: 'spinner.svg',
    SET_UP_PIN_DIALOG: 'set-up-pin-dialog.svg',
    ONE_DEVICE_CONFIRM: 'one-device-confirm.svg',
    DEVICE_ANOTHER_SESSION: 'device-another-session.svg',
    CONNECT_DEVICE: 'connect-device.svg',
    '404': '404.svg',
    HOW_TO_ENTER_BOOTLOADER_MODEL_1: 'how-to-enter-bootloader-model-1.svg',
    HOW_TO_ENTER_BOOTLOADER_MODEL_2: 'how-to-enter-bootloader-model-2.svg',
} as const;

type Image = keyof typeof IMAGES;
export type Props = React.ImgHTMLAttributes<Omit<HTMLImageElement, 'src'>> & {
    image: Image;
    alt?: string; // why? Seems not to be part of HTMLImageElement :(
};

const Image = styled.img`
    /* should not overflow it's container */
    max-width: 100%;

    ${props =>
        props.theme.IMAGE_FILTER &&
        css`
            filter: ${props.theme.IMAGE_FILTER};
        `}
`;

const ImageComponent = ({ image, alt = '', ...props }: Props) => (
    <Image {...props} alt={alt} src={resolveStaticPath(`${PATH}/${IMAGES[image]}`)} />
);

export default ImageComponent;
