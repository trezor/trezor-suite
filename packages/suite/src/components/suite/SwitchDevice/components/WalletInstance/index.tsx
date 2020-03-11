import React from 'react';
import styled, { css } from 'styled-components';
import { Button, Switch, colors, variables } from '@trezor/components';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Props } from './Container';
import { FormattedNumber, WalletLabeling, Translation } from '@suite-components';

const Wrapper = styled.div<{ selected: boolean }>`
    display: flex;
    width: 100%;
    padding: 18px 20px;
    align-items: center;
    flex-direction: row;

    cursor: pointer;
    background: ${colors.WHITE};

    &:hover {
        background: ${colors.BLACK96};
    }

    &:first-of-type {
        border-top-left-radius: 3px;
        border-top-right-radius: 3px;
    }

    &:last-of-type {
        border-bottom-left-radius: 3px;
        border-bottom-right-radius: 3px;
    }

    ${props =>
        props.selected &&
        css`
            background: ${colors.BLACK96};
        `}
`;

const InstanceType = styled.div`
    color: ${colors.BLACK25};
    font-weight: 600;
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const InstanceTitle = styled.div`
    margin-top: 6px;
    color: ${colors.BLACK25};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Col = styled.div<{ grow?: number; centerItems?: boolean }>`
    display: flex;
    flex-grow: ${props => props.grow || 0};
    flex-direction: column;
    align-items: ${props => (props.centerItems ? 'center' : 'flex-start')};
`;

const SwitchCol = styled.div`
    display: flex;
    flex-direction: column;
    margin-right: 70px;
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
    forgetDevice,
    accounts,
    fiat,
    localCurrency,
    getDiscovery,
    ...rest
}: Props) => {
    const discoveryProcess = instance.state ? getDiscovery(instance.state) : null;
    const deviceAccounts = accountUtils.getAllAccounts(instance.state, accounts);
    const accountsCount = deviceAccounts.length;
    const instanceBalance = accountUtils.getTotalFiatBalance(deviceAccounts, localCurrency, fiat);

    return (
        <Wrapper
            data-test={`@switch-device/wallet-instance/${instance.instance}`}
            key={`${instance.label}${instance.instance}${instance.state}`}
            selected={enabled && selected && !!discoveryProcess}
            {...rest}
        >
            <Col grow={1} onClick={() => selectDeviceInstance(instance)}>
                {discoveryProcess && (
                    <InstanceType>
                        <WalletLabeling device={instance} />
                    </InstanceType>
                )}
                {!discoveryProcess && (
                    <InstanceType>
                        <Translation id="TR_UNDISCOVERED_WALLET" />
                    </InstanceType>
                )}
                <InstanceTitle>
                    <Translation
                        id="TR_NUM_ACCOUNTS_FIAT_VALUE"
                        values={{
                            accountsCount,
                            fiatValue: (
                                <FormattedNumber
                                    value={instanceBalance.toString()}
                                    currency={localCurrency}
                                />
                            ),
                        }}
                    />
                </InstanceTitle>
            </Col>
            {enabled && discoveryProcess && (
                <>
                    <SwitchCol>
                        <Switch
                            checked={instance.remember}
                            onChange={() => rememberDevice(instance)}
                            data-test="@suite/settings/device/passphrase-switch"
                        />
                    </SwitchCol>
                    <Col>
                        <ForgetButton
                            size="small"
                            variant="secondary"
                            onClick={() => forgetDevice(instance)}
                        >
                            <Translation id="TR_HIDE_WALLET" />
                        </ForgetButton>
                    </Col>
                </>
            )}
        </Wrapper>
    );
};

export default WalletInstance;
