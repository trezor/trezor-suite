import { Translation } from 'src/components/suite';
import { Warning } from '@trezor/components';

interface OnlineStatusProps {
    isOnline: boolean;
}

export const OnlineStatus = ({ isOnline }: OnlineStatusProps) => {
    if (isOnline) return null;

    return (
        <Warning icon variant="destructive">
            <Translation id="TR_YOU_WERE_DISCONNECTED_DOT" />
        </Warning>
    );
};
