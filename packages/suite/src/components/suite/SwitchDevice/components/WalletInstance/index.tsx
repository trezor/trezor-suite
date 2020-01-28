import React from 'react';
import styled, { css } from 'styled-components';
import { Button, Switch, colors, variables } from '@trezor/components-v2';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Props } from './Container';
import { FormattedNumber } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';

const Wrapper = styled.div<{ selected: boolean }>`
    display: flex;
    padding: 10px 24px;
    align-items: center;
    flex-direction: row;
    cursor: pointer;

    &:hover {
        background: ${colors.BLACK96};
    }

    ${props =>
        props.selected &&
        css`
            background: ${colors.BLACK96};
        `}
`;

const InstanceTitle = styled.div`
    color: ${colors.BLACK50};
    font-weight: 600;
    font-size: ${variables.FONT_SIZE.TINY};
    text-transform: uppercase;
`;
const InstanceType = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
    /* text-transform: uppercase; */
`;

const Col = styled.div<{ grow?: number }>`
    display: flex;
    flex-grow: ${props => props.grow || 0};
    align-items: flex-start;
    flex-direction: column;
`;

const ForgetButton = styled(Button)`
    font-size: ${variables.FONT_SIZE.BUTTON};
`;

const WalletInstance = ({
    instance,
    enabled,
    selected,
    selectDeviceInstance,
    rememberDevice,
    forgetDeviceInstance,
    accounts,
    fiat,
    localCurrency,
    getDiscovery,
}: Props) => {
    const discoveryProcess = instance.state ? getDiscovery(instance.state) : null;
    const deviceAccounts = accountUtils.getAllAccounts(instance.state, accounts);
    const coinsCount = accountUtils.countUniqueCoins(deviceAccounts);
    const accountsCount = deviceAccounts.length;
    const instanceBalance = accountUtils.getTotalBalance(deviceAccounts, localCurrency, fiat);
    let instanceType = instance.useEmptyPassphrase ? 'No passphrase' : 'Passphrase';
    if (!discoveryProcess) {
        instanceType = ' ';
    }

    return (
        <Wrapper
            key={`${instance.label}${instance.instance}${instance.state}`}
            selected={enabled && selected && !!discoveryProcess}
        >
            <Col grow={1} onClick={() => selectDeviceInstance(instance)}>
                {discoveryProcess && (
                    <InstanceTitle>
                        <Translation
                            {...messages.TR_NUM_ACCOUNTS_NUM_COINS_FIAT_VALUE}
                            values={{
                                accountsCount,
                                coinsCount,
                                fiatValue: (
                                    <FormattedNumber
                                        value={instanceBalance.toString()}
                                        currency={localCurrency}
                                    />
                                ),
                            }}
                        />
                    </InstanceTitle>
                )}
                {!discoveryProcess && (
                    <InstanceTitle>
                        <Translation {...messages.TR_UNDISCOVERED_WALLET} />
                    </InstanceTitle>
                )}
                <InstanceType>{instanceType}</InstanceType>
            </Col>
            {enabled && discoveryProcess && (
                <Col>
                    <Switch
                        checked={instance.remember}
                        onChange={() => rememberDevice(instance)}
                        data-test="@suite/settings/device/passphrase-switch"
                    />
                </Col>
            )}
            {enabled && discoveryProcess && (
                <Col>
                    <ForgetButton
                        size="small"
                        variant="secondary"
                        onClick={() => forgetDeviceInstance(instance)}
                    >
                        <Translation {...messages.TR_FORGET} />
                    </ForgetButton>
                </Col>
            )}
        </Wrapper>
    );
};

export default WalletInstance;
