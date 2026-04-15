import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

type EarnFeatureDisabledBannerProps = {
    content?: ReactNode;
};

export const EarnFeatureDisabledBanner = ({ content }: EarnFeatureDisabledBannerProps) => (
    <Banner
        icon="warning"
        intent="warning"
        description={content ?? <Translation id="TR_EARN_NOT_AVAILABLE" />}
    />
);
