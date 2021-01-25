import * as deviceSettingsActions from '@suite/actions/settings/deviceSettingsActions';
import { NOTIFICATION, SUITE } from '@suite-actions/constants';

export default [
    {
        description: 'Wipe device',
        action: () => deviceSettingsActions.wipeDevice(),
        mocks: { success: true, payload: { message: 'huraa' } },
        result: {
            actions: [
                { type: SUITE.FORGET_DEVICE },
                { type: NOTIFICATION.TOAST, payload: { type: 'device-wiped' } },
            ],
        },
    },
    {
        description: 'Wipe device',
        action: () => deviceSettingsActions.wipeDevice(),
        mocks: { success: false, payload: { error: 'fuuu' } },
        result: {
            actions: [{ type: NOTIFICATION.TOAST, payload: { type: 'error', error: 'fuuu' } }],
        },
    },
    {
        description: 'Apply settings',
        action: () => deviceSettingsActions.applySettings({ label: 'foo' }),
        mocks: { success: true, payload: { message: 'huraa' } },
        result: {
            actions: [{ type: NOTIFICATION.TOAST, payload: { type: 'settings-applied' } }],
        },
    },
    {
        description: 'Apply settings - connect error',
        action: () => deviceSettingsActions.applySettings({ label: 'foo' }),
        mocks: { success: false, payload: { error: 'eeeh' } },
        result: {
            actions: [{ type: NOTIFICATION.TOAST, payload: { type: 'error', error: 'eeeh' } }],
        },
    },
    {
        description: 'Change pin',
        action: () => deviceSettingsActions.changePin({}),
        mocks: { success: true, payload: { message: 'huraa' } },
        result: {
            actions: [{ type: NOTIFICATION.TOAST, payload: { type: 'pin-changed' } }],
        },
    },
    {
        description: 'Change pin - connect error',
        action: () => deviceSettingsActions.changePin({}),
        mocks: { success: false, payload: { error: 'eeeh' } },
        result: {
            actions: [{ type: NOTIFICATION.TOAST, payload: { type: 'error', error: 'eeeh' } }],
        },
    },
];
