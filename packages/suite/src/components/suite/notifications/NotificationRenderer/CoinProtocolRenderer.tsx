import { useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';

import { CoinLogo } from '@trezor/components';
import { capitalizeFirstLetter } from '@trezor/utils';

import { fillSendForm, resetProtocol } from 'src/actions/suite/protocolActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { PROTOCOL_TO_NETWORK } from 'src/constants/suite/protocol';
import type { NotificationRendererProps } from 'src/components/suite';
import type { Network } from 'src/types/wallet';
import { ConditionalActionRenderer } from './ConditionalActionRenderer';

const Row = styled.span`
    display: flex;
`;

const getIcon = (symbol?: Network['symbol']) => symbol && <CoinLogo symbol={symbol} size={24} />;

const useActionAllowed = (path: string, network?: Network['symbol']) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const pathMatch = useRouteMatch(`${process.env.ASSET_PREFIX || ''}${path}`);

    return !!pathMatch && selectedAccount?.network?.symbol === network;
};

export const CoinProtocolRenderer = ({
    render,
    notification,
}: NotificationRendererProps<'coin-scheme-protocol'>) => {
    const dispatch = useDispatch();
    const allowed = useActionAllowed('/accounts/send', PROTOCOL_TO_NETWORK[notification.scheme]);

    const onAction = () => dispatch(fillSendForm(true));
    const onCancel = () => dispatch(resetProtocol);

    return (
        <ConditionalActionRenderer
            render={render}
            notification={notification}
            header={<Translation id="TOAST_COIN_SCHEME_PROTOCOL_HEADER" />}
            body={
                <>
                    <Row>
                        {notification.amount && `${notification.amount} `}
                        {capitalizeFirstLetter(notification.scheme)}
                    </Row>
                    <Row>{notification.address}</Row>
                </>
            }
            actionLabel="TOAST_COIN_SCHEME_PROTOCOL_ACTION"
            actionAllowed={allowed}
            onAction={onAction}
            onCancel={onCancel}
            icon={getIcon(PROTOCOL_TO_NETWORK[notification.scheme])}
        />
    );
};
