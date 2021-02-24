import React from 'react';
import styled from 'styled-components';
import { Switch, Box, Icon, useTheme, variables } from '@trezor/components';
import * as accountUtils from '@wallet-utils/accountUtils';
import * as suiteActions from '@suite-actions/suiteActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { FormattedNumber, WalletLabeling, Translation, MetadataLabeling } from '@suite-components';
import { useAnalytics, useSelector, useActions } from '@suite-hooks';
import { TrezorDevice, AcquiredDevice } from '@suite-types';

const Wrapper = styled(Box)`
    display: flex;
    width: 100%;
    align-items: center;
    background: ${props => props.theme.BG_WHITE};
    cursor: pointer;

    & + & {
        margin-top: 10px;
    }
`;

const InstanceType = styled.div`
    display: flex;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: 500;
    font-size: ${variables.FONT_SIZE.NORMAL};
    line-height: 1.5;
    align-items: center;

    /* these styles ensure proper metadata behavior */
    white-space: nowrap;
    overflow: hidden;
    max-width: 300px;
`;

const InstanceTitle = styled.div`
    font-weight: 500;
    line-height: 1.57;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
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

interface Props {
    instance: AcquiredDevice;
    enabled: boolean;
    selected: boolean;
    selectDeviceInstance: (instance: TrezorDevice) => void;
    index: number; // used only in data-test
}

const WalletInstance = ({
    instance,
    enabled,
    selected,
    selectDeviceInstance,
    index,
    ...rest
}: Props) => {
    const { rememberDevice, forgetDevice, getDiscovery } = useActions({
        rememberDevice: suiteActions.rememberDevice,
        forgetDevice: suiteActions.forgetDevice,
        getDiscovery: discoveryActions.getDiscovery,
    });
    const { accounts, fiat, localCurrency } = useSelector(state => ({
        accounts: state.wallet.accounts,
        fiat: state.wallet.fiat,
        localCurrency: state.wallet.settings.localCurrency,
    }));

    const theme = useTheme();

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

    const dataTestBase = `@switch-device/wallet-on-index/${index}`;

    return (
        <Wrapper
            data-test={dataTestBase}
            key={`${instance.label}${instance.instance}${instance.state}`}
            state={isSelected ? 'success' : undefined}
            {...rest}
        >
            <Col grow={1} onClick={() => selectDeviceInstance(instance)}>
                {discoveryProcess && (
                    <InstanceType>
                        {!instance.useEmptyPassphrase && (
                            <LockIcon icon="LOCK_ACTIVE" color={theme.TYPE_DARK_GREY} size={12} />
                        )}
                        {instance.state ? (
                            <MetadataLabeling
                                defaultVisibleValue={<WalletLabeling device={instance} />}
                                payload={{
                                    type: 'walletLabel',
                                    deviceState: instance.state,
                                    defaultValue: instance.useEmptyPassphrase
                                        ? 'standard-wallet'
                                        : `hidden-wallet-${instance.walletNumber}`,
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
                            onChange={() => {
                                rememberDevice(instance);
                                analytics.report({
                                    type: instance.remember
                                        ? 'switch-device/forget'
                                        : 'switch-device/remember',
                                });
                            }}
                            data-test={`${dataTestBase}/toggle-remember-switch`}
                        />
                    </SwitchCol>
                    <ColEject centerItems>
                        <Icon
                            data-test={`${dataTestBase}/eject-button`}
                            icon="EJECT"
                            size={22}
                            color={theme.TYPE_LIGHT_GREY}
                            onClick={() => {
                                forgetDevice(instance);
                                analytics.report({
                                    type: 'switch-device/eject',
                                });
                            }}
                        />
                    </ColEject>
                </>
            )}
        </Wrapper>
    );
};

export default WalletInstance;
