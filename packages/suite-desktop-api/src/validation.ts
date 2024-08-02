import { RendererChannels } from './api';
import { SuiteThemeVariant } from './messages';

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
    'tor/status',
    'tor/bootstrap',
    'tor/settings',
    'protocol/open',
    'handshake/event',
    'bridge/status',
    'bridge/settings',
];
export const isValidChannel = (channel: any) => validChannels.includes(channel);
