import { Translation } from 'src/components/suite';
import { Banner } from '../Banner';

interface OnlineStatusProps {
    isOnline: boolean;
}

export const OnlineStatus = ({ isOnline }: OnlineStatusProps) => {
    if (isOnline) return null;

    return (
        <Banner variant="destructive" body={<Translation id="TR_YOU_WERE_DISCONNECTED_DOT" />} />
    );
};
