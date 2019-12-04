import React from 'react';
import styled, { css } from 'styled-components';
import { Icon, Button } from '@trezor/components-v2';
import { AcquiredDevice, TrezorDevice } from '@suite/types/suite';

const Wrapper = styled.div<{ active: boolean }>`
    display: flex;
    padding: 10px 24px;
    align-items: center;
    flex-direction: row;
    cursor: pointer;

    &:hover {
        background: #f5f5f5;
    }

    ${props =>
        props.active &&
        css`
            background: #f5f5f5;
        `}
`;

const InstanceTitle = styled.div`
    color: #808080;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
`;
const InstanceType = styled.div`
    color: #808080;
    font-size: 12px;
    /* text-transform: uppercase; */
`;

const SortIconWrapper = styled.div`
    margin-right: 12px;
`;

const Col = styled.div<{ grow?: number }>`
    display: flex;
    flex-grow: ${props => props.grow || 0};
    align-items: flex-start;
    flex-direction: column;
`;

const ForgetButton = styled(Button)`
    font-size: 14px;
`;

interface Props {
    instance: AcquiredDevice;
    active: boolean;
    accountsCount: number;
    selectInstance: (instance: TrezorDevice) => void;
    forgetDeviceInstance: (instance: TrezorDevice) => void;
}

const WalletInstance = ({
    instance,
    active,
    accountsCount,
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
                <InstanceTitle>{accountsCount} Accounts - X COINS - Y USD</InstanceTitle>
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
