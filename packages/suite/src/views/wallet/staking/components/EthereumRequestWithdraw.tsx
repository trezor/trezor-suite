import React from 'react';
import { AppState } from '@suite-types';
import { Card, Warning } from '@trezor/components';
import { Actions, Column, Row, Title, Value } from './CardanoPrimitives';
import { DeviceButton, HiddenPlaceholder } from '@suite-components';
import { DeviceModel } from '@trezor/device-utils';
import { formatNetworkAmount } from '@suite-common/wallet-utils';

interface EthereumRequestWithdrawProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
    deviceModel: Exclude<DeviceModel, DeviceModel.UNKNOWN>;
}

export const EthereumRequestWithdraw = ({
    selectedAccount,
    deviceModel,
}: EthereumRequestWithdrawProps) => {
    const symbol = selectedAccount.account.symbol.toUpperCase();
    const stakedBalance = formatNetworkAmount('0', selectedAccount.account.symbol);
    const rewardedBalance = formatNetworkAmount('0', selectedAccount.account.symbol);

    return (
        <Card>
            <Warning variant="info" withIcon>
                Sit back, relax and let your {symbol} work hard for you in our stake pool. With
                automatic restaking, your rewards are working too. When you're ready to unstake,
                just remember it may take up to 14 days for your {symbol} to return from its hard
                work. But once it's back, you can claim and enjoy the fruits of your labor!
            </Warning>
            <Row>
                <Column>
                    <Title>Staked balance</Title>
                    <HiddenPlaceholder>
                        <Value>
                            {stakedBalance} {symbol}
                        </Value>
                    </HiddenPlaceholder>
                </Column>
            </Row>
            <Row>
                <Column>
                    <Title>Rewarded balance</Title>
                    <HiddenPlaceholder>
                        <Value>
                            {rewardedBalance} {symbol}
                        </Value>
                    </HiddenPlaceholder>
                </Column>
            </Row>
            <Actions>
                <DeviceButton deviceModel={deviceModel} onClick={() => {}}>
                    Request withdraw
                </DeviceButton>
            </Actions>
        </Card>
    );
};
