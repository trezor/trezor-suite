import React from 'react';
import { AppState } from '@suite-types';
import { Card, Warning } from '@trezor/components';
import { Actions, Column, Row, Title, Value } from './CardanoPrimitives';
import { DeviceButton, HiddenPlaceholder } from '@suite-components';
import { DeviceModel } from '@trezor/device-utils';
import { formatNetworkAmount } from '@suite-common/wallet-utils';

interface EthereumStakeProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
    deviceModel: Exclude<DeviceModel, DeviceModel.UNKNOWN>;
    onClick: () => void;
}

export const EthereumStake = ({ selectedAccount, deviceModel, onClick }: EthereumStakeProps) => {
    const symbol = selectedAccount.account.symbol.toUpperCase();
    const apy = '6%';
    const idleBalance = formatNetworkAmount(
        selectedAccount.account.balance,
        selectedAccount.account.symbol,
    );

    return (
        <Card>
            <Warning variant="info" withIcon>
                Stake your {symbol} and cook up a storm with a free pan and Trezor Model T. Plus,
                your crypto will grow by {apy} per year, making this offer even more delicious.
                Don't let your balance sit idle, stake now and enjoy the rewards!
            </Warning>
            <Row>
                <Column>
                    <Title>Idle balance</Title>
                    <HiddenPlaceholder>
                        <Value>
                            {idleBalance} {symbol}
                        </Value>
                    </HiddenPlaceholder>
                </Column>
            </Row>
            <Actions>
                <DeviceButton deviceModel={deviceModel} onClick={onClick}>
                    Stake
                </DeviceButton>
            </Actions>
        </Card>
    );
};
