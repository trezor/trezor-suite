import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite';

export const NoConnectionBanner = () => (
    <Banner icon variant="destructive">
        <Translation id="TR_YOU_WERE_DISCONNECTED_DOT" />
    </Banner>
);
