import type { RouterApp } from '@suite/router-config';

/**
 * Only start account discovery on these router apps, i.e. apps that interact with accounts (view, receive, send, etc.).
 * Discovery shall not be started at other pages, because it's not necessary, but in some cases, it might even be
 * undesired (the user might wish to change settings BEFORE starting discovery).
 */
export const SHOULD_ROUTER_APP_START_DISCOVERY: Record<RouterApp, boolean> = {
    dashboard: true,
    wallet: true,
    earn: true,
    'earn-yield': true,
    'earn-staking': true,

    start: false,
    version: false,
    'bridge-requested': false,
    bridge: false,
    'bridge-deprecated': false,
    'connect-popup': false,
    udev: false,
    'switch-device': false,
    onboarding: false,
    'password-manager': false,
    settings: false,
    recovery: false,
    backup: false,
    firmware: false,
    'firmware-type': false,
    'firmware-custom': false,
    'create-multi-share-backup': false,
    'create-wallet-backup': false,
    notifications: false,
    unknown: false,
};
