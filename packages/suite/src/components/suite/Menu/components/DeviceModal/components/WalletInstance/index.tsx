import React from 'react';
import styled, { css } from 'styled-components';
import { Icon, Button, colors, variables } from '@trezor/components-v2';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Props } from './Container';
import { toFiatCurrency } from '@suite/utils/wallet/fiatConverterUtils';
import BigNumber from 'bignumber.js';
import { FormattedNumber } from '@suite/components/suite';

const Wrapper = styled.div<{ active: boolean }>`
    display: flex;
    padding: 10px 24px;
    align-items: center;
    flex-direction: row;
    cursor: pointer;

    &:hover {
        background: ${colors.BLACK96};
    }

    ${props =>
        props.active &&
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

const SortIconWrapper = styled.div`
    margin-right: ${variables.FONT_SIZE.TINY};
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
    active,
    selectInstance,
    forgetDeviceInstance,
    accounts,
    fiat,
    localCurrency,
    getDiscovery,
}: Props) => {
    const discoveryProcess = instance.state ? getDiscovery(instance.state) : null;
    const deviceAccounts = accountUtils.getDeviceAccounts(instance, accounts);
    const coinsCount = accountUtils.countUniqueCoins(deviceAccounts);
    const accountsCount = deviceAccounts.length;

    let instanceBalance = new BigNumber(0);
    deviceAccounts.forEach(a => {
        const fiatRates = fiat.find(f => f.symbol === a.symbol);
        if (fiatRates) {
            const fiatBalance = toFiatCurrency(a.balance, localCurrency, fiatRates);
            if (fiatBalance) {
                instanceBalance = instanceBalance.plus(
                    accountUtils.formatNetworkAmount(fiatBalance, a.symbol),
                );
            }
        }
    });

    return (
        <Wrapper
            key={`${instance.label}${instance.instance}${instance.state}`}
            active={active}
            onClick={() => {
                selectInstance(instance);
            }}
        >
            <SortIconWrapper>
                <Icon size={12} icon="SORT" />
            </SortIconWrapper>
            <Col grow={1}>
                {discoveryProcess && (
                    <InstanceTitle>
                        {accountsCount} Accounts - {coinsCount} COINS -{' '}
                        <FormattedNumber
                            value={instanceBalance.toString()}
                            currency={localCurrency}
                        />
                    </InstanceTitle>
                )}
                {!discoveryProcess && <InstanceTitle>Undiscovered wallet</InstanceTitle>}
                <InstanceType>
                    {instance.useEmptyPassphrase ? 'No passphrase' : 'Passphrase'}
                </InstanceType>
            </Col>
            <Col>
                {discoveryProcess && !instance.useEmptyPassphrase && (
                    <ForgetButton
                        size="small"
                        variant="secondary"
                        inlineWidth
                        onClick={() => {
                            forgetDeviceInstance(instance);
                        }}
                    >
                        Forget instance
                    </ForgetButton>
                )}
                {!discoveryProcess && (
                    <Button
                        size="small"
                        isDisabled
                        variant="tertiary"
                        inlineWidth
                        icon="INFO"
                        onClick={() => {}}
                    >
                        Connect to discover
                    </Button>
                )}
            </Col>
        </Wrapper>
    );
};

export default WalletInstance;
