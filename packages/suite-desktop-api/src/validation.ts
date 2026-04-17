import { type RendererChannels } from './api';
import { type SuiteThemeVariant } from './messages';

type Primitive = 'boolean' | 'string' | 'number';
type OptionalPrimitive = Primitive | [Primitive, boolean];

export const isPrimitive = (type: OptionalPrimitive, value: any) => {
    const [t, optional] = Array.isArray(type) ? type : [type];
    if (value == null && optional) return true;

    return typeof value === t;
};

export const isObject = (shape: { [key: string]: OptionalPrimitive }, value: any) => {
    if (value == null || typeof value !== 'object') return false;
    const keys = Object.keys(shape).map(key => {
        const type = shape[key]!;

        return isPrimitive(type, value[key]);
    });

    return !keys.includes(false);
};

const validThemes: Array<SuiteThemeVariant> = ['light', 'dark', 'system'];
export const isTheme = (theme: any) => validThemes.includes(theme);

const validChannels: Array<keyof RendererChannels> = [
    'oauth/response',
    'update/checking',
    'update/available',
    'update/not-available',
    'update/error',
    'update/downloading',
    'update/downloaded',
    'update/allow-prerelease',
    'update/set-automatic-update-enabled',
    'update/set-auto-install-on-app-quit',
    'tor/status',
    'tor/bootstrap',
    'tor/settings',
    'protocol/open',
    'handshake/event',
    'bridge/status',
    'bridge/settings',
    'tray/settings',
    'connect-popup/call',
    'connect-popup/cancel',
    'app/auto-start/popup-request',
    'power-monitor/suspend',
    'bio-auth/validation-status-changed',
    'bio-auth/bio-auth-availability-changed',
    'bio-auth/settings-changed',
    'theme/system-change',
];
export const isValidChannel = (channel: any) => validChannels.includes(channel);
