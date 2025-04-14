import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { Note, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { Translation } from './Translation';

export const ConnectCallSource = () => {
    const connectPopupCall = useSelector(selectConnectPopupCall);
    if (connectPopupCall?.state !== 'ongoing' && connectPopupCall?.state !== 'call-error')
        return null;

    return (
        <Note iconName="plug">
            <Translation id="TR_CONNECTED_TO" />
            {': '}
            <Text variant="primary">
                {connectPopupCall.source?.manifest?.appName || connectPopupCall.source?.origin}
            </Text>
        </Note>
    );
};
