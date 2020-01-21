import * as deviceSettingsActions from '@suite/actions/settings/deviceSettingsActions';
import { NOTIFICATION } from '@suite-actions/constants';

export default [
    {
        description: 'Wipe device',
        action: () => deviceSettingsActions.wipeDevice(),
        mocks: { success: true, payload: { message: 'huraa' } },
        result: {
            actions: [{ type: NOTIFICATION.ADD }],
        },
    },
    {
        description: 'Wipe device',
        action: () => deviceSettingsActions.wipeDevice(),
        mocks: { success: false, payload: { error: 'fuuu' } },
        result: {
            actions: [{ type: NOTIFICATION.ADD, payload: { variant: 'error' } }],
        },
    },
    {
        description: 'Apply settings',
        action: () => deviceSettingsActions.applySettings({ label: 'foo' }),
        mocks: { success: true, payload: { message: 'huraa' } },
        result: {
            actions: [{ type: NOTIFICATION.ADD, payload: { variant: 'success' } }],
        },
    },
    {
        description: 'Apply settings - connect error',
        action: () => deviceSettingsActions.applySettings({ label: 'foo' }),
        mocks: { success: false, payload: { error: 'eeeh' } },
        result: {
            actions: [{ type: NOTIFICATION.ADD, payload: { variant: 'error' } }],
        },
    },
    {
        description: 'Change pin',
        action: () => deviceSettingsActions.changePin({}),
        mocks: { success: true, payload: { message: 'huraa' } },
        result: {
            actions: [{ type: NOTIFICATION.ADD, payload: { variant: 'success' } }],
        },
    },
    {
        description: 'Change pin - connect error',
        action: () => deviceSettingsActions.changePin({}),
        mocks: { success: false, payload: { error: 'eeeh' } },
        result: {
            actions: [{ type: NOTIFICATION.ADD, payload: { variant: 'error' } }],
        },
    },
];
