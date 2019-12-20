import React from 'react';
import styled, { css } from 'styled-components';
import { Icon, Button, colors, variables } from '@trezor/components-v2';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Props } from './Container';
import { FormattedNumber } from '@suite/components/suite';
import { Translation } from '@suite/components/suite/Translation';
import messages from '@suite/support/messages';

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
    const instanceBalance = accountUtils.getTotalBalance(deviceAccounts, localCurrency, fiat);

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
                <InstanceType>
                    {instance.useEmptyPassphrase ? 'No passphrase' : 'Passphrase'}
                </InstanceType>
            </Col>
            <Col>
                {discoveryProcess && !instance.useEmptyPassphrase && (
                    <ForgetButton
                        size="small"
                        variant="secondary"
                        onClick={() => {
                            forgetDeviceInstance(instance);
                        }}
                    >
                        <Translation {...messages.TR_FORGET} />
                    </ForgetButton>
                )}
                {!discoveryProcess && (
                    <Button
                        size="small"
                        isDisabled
                        variant="tertiary"
                        icon="INFO"
                        onClick={() => {}}
                    >
                        <Translation {...messages.TR_CONNECT_TO_DISCOVER} />
                    </Button>
                )}
            </Col>
        </Wrapper>
    );
};

export default WalletInstance;
