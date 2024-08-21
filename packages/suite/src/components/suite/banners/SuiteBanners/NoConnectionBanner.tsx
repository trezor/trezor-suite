import { Translation } from 'src/components/suite';
import { Warning } from '@trezor/components';

export const NoConnectionBanner = () => (
    <Warning icon variant="destructive">
        <Translation id="TR_YOU_WERE_DISCONNECTED_DOT" />
    </Warning>
);
