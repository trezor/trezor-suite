import { TranslationKey } from '@suite-common/intl-types';
import { desktopApi } from '@trezor/suite-desktop-api';
import { EXPERIMENTAL_PASSWORD_MANAGER_KB_URL, TOR_SNOWFLAKE_PROJECT_URL, Url } from '@trezor/urls';
import { Route } from '@suite-common/suite-types';

import { Dispatch } from '../../types/suite';

export type ExperimentalFeature = 'password-manager' | 'tor-snowflake';

export type ExperimentalFeatureConfig = {
    title: TranslationKey;
    description: TranslationKey;
    knowledgeBaseUrl?: Url;
    routeName?: Route['name'];
    isDisabled?: (context: { isDebug: boolean }) => boolean;
    onToggle?: ({ newValue, dispatch }: { newValue: boolean; dispatch: Dispatch }) => void;
};

export const EXPERIMENTAL_FEATURES: Record<ExperimentalFeature, ExperimentalFeatureConfig> = {
    'password-manager': {
        title: 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
        description: 'TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION',
        knowledgeBaseUrl: EXPERIMENTAL_PASSWORD_MANAGER_KB_URL,
        routeName: 'password-manager-index',
    },
    'tor-snowflake': {
        title: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE',
        description: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE_DESCRIPTION',
        knowledgeBaseUrl: TOR_SNOWFLAKE_PROJECT_URL,
        onToggle: async ({ newValue }) => {
            if (!newValue) {
                const result = await desktopApi.getTorSettings();
                if (result.success && result.payload.snowflakeBinaryPath !== '') {
                    await desktopApi.changeTorSettings({
                        ...result.payload,
                        snowflakeBinaryPath: '',
                    });
                }
            }
        },
    },
};
