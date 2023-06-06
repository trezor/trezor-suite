import React from 'react';
import { AppState } from '@suite-types';
import { Card, Warning } from '@trezor/components';
import { Actions, Column, Row, Title, Value } from './CardanoPrimitives';
import { DeviceButton, HiddenPlaceholder } from '@suite-components';
import { DeviceModel } from '@trezor/device-utils';
import { formatNetworkAmount } from '@suite-common/wallet-utils';

interface EthereumClaimProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
    deviceModel: Exclude<DeviceModel, DeviceModel.UNKNOWN>;
    onClick: () => void;
}

export const EthereumClaim = ({ selectedAccount, deviceModel, onClick }: EthereumClaimProps) => {
    const symbol = selectedAccount.account.symbol.toUpperCase();
    const withdrawingBalance = formatNetworkAmount('0', selectedAccount.account.symbol);

    return (
        <Card>
            <Warning variant="info" withIcon>
                Your unstaked {symbol} is just around the corner! It's almost ready to be picked up,
                so sit tight and keep your eyes peeled for that green button. We promise it will be
                back and better than ever before you know it.
            </Warning>
            <Row>
                <Column>
                    <Title>Soon-to-be-idle balance</Title>
                    <HiddenPlaceholder>
                        <Value>
                            {withdrawingBalance} {symbol}
                        </Value>
                    </HiddenPlaceholder>
                </Column>
            </Row>
            <Actions>
                <DeviceButton deviceModel={deviceModel} onClick={onClick}>
                    Claim
                </DeviceButton>
            </Actions>
        </Card>
    );
};
