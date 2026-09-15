import type { RouterApp } from '@suite/router-config';

/**
 * If any of the authenticity checks fails, the device is treated as compromised – the UX is blocked with a modal
 * overlaying the whole app and preventing any action. But the checks can be influenced by settings (turning them off),
 * or by installing the official firmware (thus clearing the device).
 * Those router apps are therefore always available (not blocked by the overlay), to prevent a deadlock.
 */
export const SHOULD_ROUTER_APP_SKIP_AUTHENTICITY_CHECKS: Record<RouterApp, boolean> = {
    settings: true,
    firmware: true,
    'firmware-type': true,
    'firmware-custom': true,

    start: false,
    dashboard: false,
    earn: false,
    'earn-yield': false,
    'earn-staking': false,
    'apps-embedding': false,
    version: false,
    'bridge-requested': false,
    bridge: false,
    'bridge-deprecated': false,
    'connect-popup': false,
    udev: false,
    'switch-device': false,
    onboarding: false,
    'password-manager': false,
    recovery: false,
    backup: false,
    'create-multi-share-backup': false,
    'create-wallet-backup': false,
    wallet: false,
    notifications: false,
    unknown: false,
};

/**
 * The interactive device checks (Manual Device Check, Device Authenticity Check) are baked into the
 * onboarding wizard itself as one of its steps once the user is inside it, so `Preloader` must not
 * also try to render them globally while onboarding is active. Otherwise identical to
 * `SHOULD_ROUTER_APP_SKIP_AUTHENTICITY_CHECKS`, for the same deadlock-prevention reasons.
 */
export const SHOULD_ROUTER_APP_SKIP_INTERACTIVE_DEVICE_CHECKS: Record<RouterApp, boolean> = {
    ...SHOULD_ROUTER_APP_SKIP_AUTHENTICITY_CHECKS,
    onboarding: true,
};
