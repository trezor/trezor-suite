import { Translation } from '@suite/intl';
import { CloudIcon } from '@trezor/icons';

import { AccountExceptionLayout } from 'src/components/wallet';

export const AssetNotExists = () => (
    <AccountExceptionLayout
        title={<Translation id="TR_ASSET_EXCEPTION_NOT_EXIST" />}
        icon={CloudIcon}
        iconVariant="neutral"
        data-testid="@asset-detail/not-exists"
    />
);
