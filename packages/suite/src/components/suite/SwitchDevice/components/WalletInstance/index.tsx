import React from 'react';
import styled, { css } from 'styled-components';
import { Button, Switch, colors, variables } from '@trezor/components';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Props } from './Container';
import { FormattedNumber, WalletLabeling, Translation } from '@suite-components';
import { useAnalytics } from '@suite-hooks';

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
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
    }

    &:last-of-type {
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
    }

    ${props =>
        props.selected &&
        css`
            background: #eaf8e5;
            border: 1px solid ${colors.GREEN};

            &:hover {
                background: #eaf8e5;
            }
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
    font-variant-numeric: tabular-nums;
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
    // openModal,
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

    const getDataTestBase = () => {
        if (instance.instance) {
            return `@switch-device/wallet-instance/${instance.instance}`;
        }
        return '@switch-device/wallet-instance';
    };

    const changeWalletMetadata = (event: any) => {
        event.preventDefault();
        // todo: hmm is this if needed? probably not, shall be handled in action
        if (!instance.state || instance.metadata.status !== 'enabled') return;
        // openModal({
        //     type: 'metadata-add',
        //     payload: {
        //         type: 'walletLabel',
        //         deviceState: instance.state,
        //         defaultValue: 'TODO: wallet default state',
        //         value: instance.metadata.walletLabel,
        //     },
        // });
        addMetadata({
            type: 'walletLabel',
            deviceState: instance.state,
            defaultValue: 'TODO: wallet default state',
            value: instance.metadata.walletLabel,
        });
    };
    return (
        <Wrapper
            data-test={getDataTestBase()}
            key={`${instance.label}${instance.instance}${instance.state}`}
            selected={enabled && selected && !!discoveryProcess}
            {...rest}
        >
            <Col grow={1} onClick={() => selectDeviceInstance(instance)}>
                {discoveryProcess && (
                    <InstanceType>
                        <WalletLabeling device={instance} />
                        {instance.state && (
                            <Button
                                variant="tertiary"
                                icon="LABEL"
                                onClick={changeWalletMetadata}
                            />
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
                    <Col>
                        <ForgetButton
                            data-test={`${getDataTestBase()}/eject-button`}
                            variant="secondary"
                            onClick={() =>
                                forgetDevice(instance) &&
                                analytics.report({
                                    type: 'switch-device/eject',
                                })
                            }
                        >
                            <Translation id="TR_EJECT_WALLET" />
                        </ForgetButton>
                    </Col>
                </>
            )}
        </Wrapper>
    );
};

export default WalletInstance;
