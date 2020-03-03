import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';

const IMAGES = {
    FIRMWARE_INIT_1: 'images/firmware-init-1.svg',
    FIRMWARE_INIT_2: 'images/firmware-init-2.svg',
    FIRMWARE_SUCCESS_1: 'images/firmware-success-1.svg',
    FIRMWARE_SUCCESS_2: 'images/firmware-success-2.svg',
    ALL_DONE: 'images/all-done.svg',
    BRIDGE_QUESTION: 'images/bridge-question.svg', // todo: not used
    BRIDGE_SUCCESS: 'images/bridge-success.svg', // todo: not used
    CONFRIM_ON_DEVICE_2: 'images/confirm-on-device-2.svg', // todo: not used
    CREATE_NEW: 'images/create-new.svg',
    EXISTING_USER: 'images/existing-user.svg',
    HOLOGRAM_WARNING: 'images/hologram-warning.svg', // todo: not used
    MODEL_1: 'images/model-1.svg',
    MODEL_2: 'images/model-2.svg',
    NEW_DEVICE: 'images/new-device.svg',
    NEW_USER: 'images/new-user.svg',
    RECOVER_FROM_SEED: 'images/recover-from-seed.svg',
    SEED_CARD_SHAMIR: 'images/seed-card-shamir.svg',
    SEED_CARD_SINGLE: 'images/seed-card-single.svg',
    SKIP_WARNING: 'images/skip-warning.svg',
    T_DEVICE_INITIALIZED: 'images/t-device-initialized.svg',
    T_PIN_ASK: 'images/t-pin-ask.svg',
    T_PIN_SUCCESS: 'images/t-pin-success.svg',
    USED_DEVICE: 'images/used-device.svg',
    WRITING_SEED: 'images/writing-seed.svg', // todo: not used
    '12_WORDS': 'images/12-words.svg',
    '18_WORDS': 'images/18-words.svg',
    '24_WORDS': 'images/24-words.svg',
    EMPTY_DASHBOARD: 'images/empty-dashboard.svg',
    EMPTY_WALLET: 'iamges/empty-wallet.svg', // todo: not used?
    ANALYTICS: 'images/analytics.svg',
    WELCOME: 'images/welcome.svg',
    UNI_ERROR: 'images/uni-error.svg',
    UNI_SUCCESS: 'images/uni-success.svg',
    UNI_WARNING: 'images/uni-warning.svg',
    UNI_EMPTY_PAGE: 'images/uni-empty-page.svg',
    TUNKNOWN: 'images/TUnknown.svg', // todo: use in device icons
    T1: 'images/T1.svg', // todo: use in device icons
    T2: 'images/T2.svg', // todo: use in device icons
    T_BRIDGE_CONFIRM: 'images/t-bridge-confirm.svg', // todo: not used
    T_BRIDGE_CHECK: 'images/t-bridge-check.svg',
    SPINNER: 'images/spinner.svg',
    SET_UP_PIN_DIALOG: 'images/set-up-pin-dialog.svg',
    ONE_DEVICE_CONFIRM: 'images/one-device-confirm.svg', // todo: not used
    DEVICE_ANOTHER_SESSION: 'images/device-another-session.svg',
    CONNECT_DEVICE: 'images/connect-device.svg',
    '404': 'images/404.svg',
} as const;

type Image = keyof typeof IMAGES;

type Props = React.HTMLAttributes<HTMLImageElement> & {
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
