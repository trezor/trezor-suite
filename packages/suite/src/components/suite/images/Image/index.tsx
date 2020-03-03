import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';

const IMAGES = {
    FIRMWARE_INIT_1: 'images/svg/firmware-init-1.svg',
    FIRMWARE_INIT_2: 'images/svg/firmware-init-2.svg',
    FIRMWARE_SUCCESS_1: 'images/svg/firmware-success-1.svg',
    FIRMWARE_SUCCESS_2: 'images/svg/firmware-success-2.svg',
    ALL_DONE: 'images/svg/all-done.svg',
    BRIDGE_QUESTION: 'images/svg/bridge-question.svg', // todo: not used
    BRIDGE_SUCCESS: 'images/svg/bridge-success.svg', // todo: not used
    CONFRIM_ON_DEVICE_2: 'images/svg/confirm-on-device-2.svg', // todo: not used
    CREATE_NEW: 'images/svg/create-new.svg',
    EXISTING_USER: 'images/svg/existing-user.svg',
    HOLOGRAM_WARNING: 'images/svg/hologram-warning.svg', // todo: not used
    MODEL_1: 'images/svg/model-1.svg',
    MODEL_2: 'images/svg/model-2.svg',
    NEW_DEVICE: 'images/svg/new-device.svg',
    NEW_USER: 'images/svg/new-user.svg',
    RECOVER_FROM_SEED: 'images/svg/recover-from-seed.svg',
    SEED_CARD_SHAMIR: 'images/svg/seed-card-shamir.svg',
    SEED_CARD_SINGLE: 'images/svg/seed-card-single.svg',
    SKIP_WARNING: 'images/svg/skip-warning.svg',
    T_DEVICE_INITIALIZED: 'images/svg/t-device-initialized.svg',
    T_PIN_ASK: 'images/svg/t-pin-ask.svg',
    T_PIN_SUCCESS: 'images/svg/t-pin-success.svg',
    USED_DEVICE: 'images/svg/used-device.svg',
    WRITING_SEED: 'images/svg/writing-seed.svg', // todo: not used
    '12_WORDS': 'images/svg/12-words.svg',
    '18_WORDS': 'images/svg/18-words.svg',
    '24_WORDS': 'images/svg/24-words.svg',
    EMPTY_DASHBOARD: 'images/svg/empty-dashboard.svg',
    EMPTY_WALLET: 'iamges/empty-wallet.svg', // todo: not used?
    ANALYTICS: 'images/svg/analytics.svg',
    WELCOME: 'images/svg/welcome.svg',
    UNI_ERROR: 'images/svg/uni-error.svg',
    UNI_SUCCESS: 'images/svg/uni-success.svg',
    UNI_WARNING: 'images/svg/uni-warning.svg',
    UNI_EMPTY_PAGE: 'images/svg/uni-empty-page.svg',
    TUNKNOWN: 'images/svg/TUnknown.svg', // todo: use in device icons
    T1: 'images/svg/T1.svg', // todo: use in device icons
    T2: 'images/svg/T2.svg', // todo: use in device icons
    T_BRIDGE_CONFIRM: 'images/svg/t-bridge-confirm.svg', // todo: not used
    T_BRIDGE_CHECK: 'images/svg/t-bridge-check.svg',
    SPINNER: 'images/svg/spinner.svg',
    SET_UP_PIN_DIALOG: 'images/svg/set-up-pin-dialog.svg',
    ONE_DEVICE_CONFIRM: 'images/svg/one-device-confirm.svg', // todo: not used
    DEVICE_ANOTHER_SESSION: 'images/svg/device-another-session.svg',
    CONNECT_DEVICE: 'images/svg/connect-device.svg',
    '404': 'images/svg/404.svg',
} as const;

type Image = keyof typeof IMAGES;

type Props = React.HTMLAttributes<Omit<HTMLImageElement, 'src'>> & {
    image: Image;
    alt?: string; // why? Seems not to be part of HTMLImageElement :(
};

const Image = styled.img`
    /* should not overflow it's container */
    max-width: 100%;
`;

export default ({ image, alt = '', ...props }: Props) => (
    <Image {...props} alt={alt} src={resolveStaticPath(IMAGES[image])} />
);
