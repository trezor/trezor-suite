import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

export const SettingsLoading = () => (
    <Banner
        intent="neutral"
        isLoading
        data-testid="@settings/loader"
        title={<Translation id="TR_LOADING_ACCOUNTS" />}
        description={<Translation id="TR_LOADING_ACCOUNTS_DESCRIPTION" />}
    />
);
