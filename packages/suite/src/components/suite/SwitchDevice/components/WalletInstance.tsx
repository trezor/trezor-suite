import React from 'react';

import styled from 'styled-components';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { selectDiscoveryByDeviceState } from 'src/reducers/wallet/discoveryReducer';
import {
    WalletLabeling,
    Translation,
    MetadataLabeling,
    HiddenPlaceholder,
} from 'src/components/suite';
import { useSelector, useActions } from 'src/hooks/suite';
import { TrezorDevice, AcquiredDevice } from 'src/types/suite';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';

import { useFormatters } from '@suite-common/formatters';
import { Switch, Box, Icon, useTheme, variables } from '@trezor/components';
import { getAllAccounts, getTotalFiatBalance } from '@suite-common/wallet-utils';
import { analytics, EventType } from '@trezor/suite-analytics';

const InstanceType = styled.div`
    display: flex;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    line-height: 1.5;
    align-items: center;

    /* these styles ensure proper metadata behavior */
    white-space: nowrap;
    overflow: hidden;
    max-width: 300px;
`;

const Wrapper = styled(Box)`
    display: flex;
    width: 100%;
    align-items: center;
    background: ${props => props.theme.BG_WHITE};

    & + & {
        margin-top: 10px;
    }

    :hover,
    :focus-within {
        background: ${({ theme }) => theme.BG_WHITE_ALT_HOVER};

        ${InstanceType} > span {
            text-decoration: underline;
        }

        ${InstanceType} div > span {
            text-decoration: underline;
        }
    }
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

    :first-child {
        cursor: pointer;
    }
`;

const ColEject = styled(Col)`
    margin: 0 22px;
`;

const SwitchCol = styled.div`
    display: flex;
    margin-right: 46px;
`;

const LockIcon = styled(Icon)`
    margin-right: 4px;
`;
interface WalletInstanceProps {
    instance: AcquiredDevice;
    enabled: boolean;
    selected: boolean;
    selectDeviceInstance: (instance: TrezorDevice) => void;
    index: number; // used only in data-test
}

export const WalletInstance = ({
    instance,
    enabled,
    selected,
    selectDeviceInstance,
    index,
    ...rest
}: WalletInstanceProps) => {
    const { toggleRememberDevice, forgetDevice } = useActions({
        toggleRememberDevice: suiteActions.toggleRememberDevice,
        forgetDevice: suiteActions.forgetDevice,
    });
    const { accounts, fiat, localCurrency, editing } = useSelector(state => ({
        accounts: state.wallet.accounts,
        fiat: state.wallet.fiat,
        localCurrency: state.wallet.settings.localCurrency,
        editing: state.metadata.editing,
    }));

    const { FiatAmountFormatter } = useFormatters();
    const theme = useTheme();

    const discoveryProcess = useSelector(state =>
        selectDiscoveryByDeviceState(state, instance.state),
    );

    const deviceAccounts = getAllAccounts(instance.state, accounts);
    const accountsCount = deviceAccounts.length;
    const instanceBalance = getTotalFiatBalance(deviceAccounts, localCurrency, fiat.coins);
    const isSelected = enabled && selected && !!discoveryProcess;
    const { walletLabel } = useSelector(state =>
        selectLabelingDataForWallet(state, instance.state),
    );
    const dataTestBase = `@switch-device/wallet-on-index/${index}`;

    return (
        <Wrapper
            data-test={dataTestBase}
            key={`${instance.label}${instance.instance}${instance.state}`}
            state={isSelected ? 'success' : undefined}
            {...rest}
        >
            <Col grow={1} onClick={() => !editing && selectDeviceInstance(instance)} tabIndex={0}>
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
                                    defaultValue: instance.state,
                                    value:
                                        instance?.metadata.status === 'enabled' ? walletLabel : '',
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
                                <HiddenPlaceholder>
                                    <FiatAmountFormatter
                                        value={instanceBalance.toString()}
                                        currency={localCurrency}
                                    />
                                </HiddenPlaceholder>
                            ),
                        }}
                    />
                </InstanceTitle>
            </Col>

            {enabled && discoveryProcess && (
                <>
                    <SwitchCol>
                        <Switch
                            isChecked={!!instance.remember}
                            onChange={() => toggleRememberDevice(instance)}
                            dataTest={`${dataTestBase}/toggle-remember-switch`}
                        />
                    </SwitchCol>

                    <ColEject centerItems>
                        <Icon
                            data-test={`${dataTestBase}/eject-button`}
                            icon="EJECT"
                            size={22}
                            color={theme.TYPE_LIGHT_GREY}
                            hoverColor={theme.TYPE_DARK_GREY}
                            onClick={() => {
                                forgetDevice(instance);
                                analytics.report({
                                    type: EventType.SwitchDeviceEject,
                                });
                            }}
                        />
                    </ColEject>
                </>
            )}
        </Wrapper>
    );
};
