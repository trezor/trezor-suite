import { Translation } from '@suite/intl';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { CALL_SOURCE_WALLETCONNECT } from '@suite-common/connect-popup/src/connectPopupTypes';
import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

import { ConnectAppIcon } from './ConnectAppIcon';

export const ConnectCallSource = () => {
    const connectPopupCall = useSelector(selectConnectPopupCall);
    if (
        connectPopupCall?.state !== 'ongoing' &&
        connectPopupCall?.state !== 'call-error' &&
        connectPopupCall?.state !== 'address-confirmation' &&
        connectPopupCall?.state !== 'tx-simulation'
    )
        return null;

    return (
        <Row gap={spacings.xs} alignItems="center">
            <ConnectAppIcon
                src={connectPopupCall.source?.manifest?.appIcon}
                size={spacings.lg}
                type={
                    connectPopupCall.source?.type === CALL_SOURCE_WALLETCONNECT
                        ? 'walletConnect'
                        : 'trezorConnect'
                }
            />
            <Text typographyStyle="hint" intent="neutral" priority="secondary">
                <Translation id="TR_CONNECTED_TO" />
                {': '}
                <Text intent="neutral">
                    {connectPopupCall.source?.manifest?.appName || connectPopupCall.source?.origin}
                </Text>
            </Text>
        </Row>
    );
};
