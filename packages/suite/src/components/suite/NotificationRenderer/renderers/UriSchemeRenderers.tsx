import React from 'react';
import styled from 'styled-components';
import { useRouteMatch } from 'react-router-dom';
import * as protocolActions from 'src/actions/suite/protocolActions';
import { Translation } from 'src/components/suite';
import { CoinLogo } from '@trezor/components';
import { useActions, useSelector } from 'src/hooks/suite';
import { capitalizeFirstLetter } from '@trezor/utils';
import { PROTOCOL_TO_NETWORK } from 'src/constants/suite/protocol';
import ConditionalActionRenderer from './ConditionalActionRenderer';

import type { NotificationRendererProps } from '../types';
import type { Network } from 'src/types/wallet';

const Row = styled.span`
    display: flex;
`;

const getIcon = (symbol?: Network['symbol']) => symbol && <CoinLogo symbol={symbol} size={24} />;

const useActionAllowed = (path: string, network?: Network['symbol']) => {
    const { selectedAccount } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
    }));
    const pathMatch = useRouteMatch(`${process.env.ASSET_PREFIX || ''}${path}`);
    return !!pathMatch && selectedAccount?.network?.symbol === network;
};

export const CoinProtocolRenderer = ({
    render,
    notification,
}: NotificationRendererProps<'coin-scheme-protocol'>) => {
    const { fillSendForm, resetProtocol } = useActions({
        fillSendForm: protocolActions.fillSendForm,
        resetProtocol: protocolActions.resetProtocol,
    });
    const allowed = useActionAllowed('/accounts/send', PROTOCOL_TO_NETWORK[notification.scheme]);
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
            onAction={() => fillSendForm(true)}
            onCancel={resetProtocol}
            icon={getIcon(PROTOCOL_TO_NETWORK[notification.scheme])}
        />
    );
};
