import { type Url } from './types';

type GetOnboardingSurveyUrlParams = {
    platform: 'desktop' | 'web' | 'mobile';
    appVersion: string;
    deviceModel?: string;
};

export const getOnboardingSurveyUrl = ({
    platform,
    appVersion,
    deviceModel,
}: GetOnboardingSurveyUrlParams): Url => {
    const params = [`platform=${platform}`, `app_version=${encodeURIComponent(appVersion)}`];
    if (deviceModel !== undefined) {
        params.push(`device_model=${encodeURIComponent(deviceModel)}`);
    }

    return `https://satoshilabs.typeform.com/to/Jg85pGy9#${params.join('&')}`;
};
