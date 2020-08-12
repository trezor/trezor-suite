import React from 'react';
import styled from 'styled-components';
import { Switch, Box, Icon, colors, variables } from '@trezor/components';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Props } from './Container';
import { FormattedNumber, WalletLabeling, Translation, AddMetadataLabel } from '@suite-components';
import { useAnalytics } from '@suite-hooks';

const Wrapper = styled(Box)`
    display: flex;
    width: 100%;
    align-items: center;
    background: ${colors.WHITE};
    cursor: pointer;

    & + & {
        margin-top: 10px;
    }
`;

const InstanceType = styled.div`
    display: flex;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: 500;
    font-size: ${variables.FONT_SIZE.NORMAL};
    line-height: 1.5;
    align-items: center;
`;

const InstanceTitle = styled.div`
    font-weight: 500;
    line-height: 1.57;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-variant-numeric: tabular-nums;
`;

const Col = styled.div<{ grow?: number; centerItems?: boolean }>`
    display: flex;
    flex-grow: ${props => props.grow || 0};
    flex-direction: column;
    align-items: ${props => (props.centerItems ? 'center' : 'flex-start')};
`;

const ColEject = styled(Col)`
    margin: 0 24px;
`;

const SwitchCol = styled.div`
    display: flex;
    margin-right: 60px;
`;

const LockIcon = styled(Icon)`
    margin-right: 4px;
`;

const WalletInstance = ({
    instance,
    enabled,
    selected,
    selectDeviceInstance,
    rememberDevice,
    forgetDevice,
    addMetadata,
    accounts,
    fiat,
    localCurrency,
    getDiscovery,
    ...rest
}: Props) => {
    const discoveryProcess = instance.state ? getDiscovery(instance.state) : null;
    const deviceAccounts = accountUtils.getAllAccounts(instance.state, accounts);
    const accountsCount = deviceAccounts.length;
    const instanceBalance = accountUtils.getTotalFiatBalance(
        deviceAccounts,
        localCurrency,
        fiat.coins,
    );
    const analytics = useAnalytics();
    const isSelected = enabled && selected && !!discoveryProcess;

    const getDataTestBase = () => {
        if (instance.instance) {
            return `@switch-device/wallet-instance/${instance.instance}`;
        }
        return '@switch-device/wallet-instance';
    };

    return (
        <Wrapper
            data-test={getDataTestBase()}
            key={`${instance.label}${instance.instance}${instance.state}`}
            state={isSelected ? 'success' : undefined}
            {...rest}
        >
            <Col grow={1} onClick={() => selectDeviceInstance(instance)}>
                {discoveryProcess && (
                    <InstanceType>
                        {!instance.useEmptyPassphrase && (
                            <LockIcon icon="LOCK" color={colors.NEUE_TYPE_DARK_GREY} size={12} />
                        )}
                        {instance.state ? (
                            <AddMetadataLabel
                                defaultVisibleValue={<WalletLabeling device={instance} />}
                                payload={{
                                    type: 'walletLabel',
                                    deviceState: instance.state,
                                    defaultValue: !instance.instance
                                        ? 'standard-wallet'
                                        : `hidden-wallet-${instance.instance}`,
                                    value:
                                        instance?.metadata.status === 'enabled'
                                            ? instance.metadata.walletLabel
                                            : '',
                                }}
                            />
                        ) : (
                            <WalletLabeling device={instance} />
                        )}
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
                            checked={!!instance.remember}
                            onChange={() =>
                                rememberDevice(instance) &&
                                analytics.report({
                                    type: instance.remember
                                        ? 'switch-device/forget'
                                        : 'switch-device/remember',
                                })
                            }
                            data-test={`${getDataTestBase()}/toggle-remember-switch`}
                        />
                    </SwitchCol>
                    <ColEject centerItems>
                        <Icon
                            data-test={`${getDataTestBase()}/eject-button`}
                            icon="EJECT"
                            size={22}
                            color={colors.NEUE_TYPE_LIGHT_GREY}
                            onClick={() =>
                                forgetDevice(instance) &&
                                analytics.report({
                                    type: 'switch-device/eject',
                                })
                            }
                        />
                    </ColEject>
                </>
            )}
        </Wrapper>
    );
};

export default WalletInstance;
