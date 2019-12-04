import React from 'react';
import styled, { css } from 'styled-components';
import { Icon, Button, colors, variables } from '@trezor/components-v2';
import { AcquiredDevice, TrezorDevice } from '@suite/types/suite';

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

interface Props {
    instance: AcquiredDevice;
    active: boolean;
    accountsCount: number;
    coinsCount: number;
    selectInstance: (instance: TrezorDevice) => void;
    forgetDeviceInstance: (instance: TrezorDevice) => void;
}

const WalletInstance = ({
    instance,
    active,
    accountsCount,
    coinsCount,
    selectInstance,
    forgetDeviceInstance,
}: Props) => {
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
                <InstanceTitle>
                    {accountsCount} Accounts - {coinsCount} COINS - Y USD
                </InstanceTitle>
                <InstanceType>
                    {instance.useEmptyPassphrase ? 'No passphrapse' : 'Passphrase'}
                </InstanceType>
            </Col>
            <Col>
                {!instance.useEmptyPassphrase && (
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
            </Col>
        </Wrapper>
    );
};

export default WalletInstance;
