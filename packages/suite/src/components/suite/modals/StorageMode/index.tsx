import { TrezorDevice } from '@suite-types';
import { Button, H2, P, Icon, colors } from '@trezor/components-v2';
import React, { FunctionComponent } from 'react';
import styled, { css } from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const Col = styled.div<{ secondary?: boolean }>`
    display: flex;
    flex: 1;
    min-width: 320px;
    flex-direction: column;
    padding: 40px;
    align-items: center;

    ${props =>
        props.secondary &&
        css`
            background: ${colors.BLACK96};
        `}
`;

const Content = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    color: ${colors.BLACK50};
`;

const CheckList = styled.div`
    color: ${colors.BLACK0};
    margin-top: 36px;
    margin-bottom: 60px;
`;

const ItemText = styled.div`
    margin-left: 10px;
`;

const Actions = styled.div`
    margin-top: 20px;
`;

const CheckItem = styled.div`
    display: flex;
    align-items: center;

    & + & {
        margin-top: 10px;
    }
`;

interface Props {
    device: TrezorDevice;
    onStorageModeSelected: (device: TrezorDevice, remember: boolean) => void;
}

const StorageMode: FunctionComponent<Props> = ({ device, onStorageModeSelected }) => {
    // useHotkeys('enter', () => onForgetDevice(device));

    return (
        <Wrapper>
            <Col>
                <H2>Normal mode</H2>
                <Content>
                    <CheckList>
                        <CheckItem>
                            <Icon icon="CHECK" size={10} color={colors.GREEN} />{' '}
                            <ItemText>Remembers your device</ItemText>
                        </CheckItem>
                        <CheckItem>
                            <Icon icon="CHECK" size={10} color={colors.GREEN} />{' '}
                            <ItemText>Remembers your device</ItemText>
                        </CheckItem>
                        <CheckItem>
                            <Icon icon="CHECK" size={10} color={colors.GREEN} />{' '}
                            <ItemText>Remembers your device</ItemText>
                        </CheckItem>
                    </CheckList>
                </Content>
                <Actions>
                    <Button variant="primary" onClick={() => onStorageModeSelected(device, true)}>
                        Continue in normal mode
                    </Button>
                </Actions>
            </Col>
            <Col secondary>
                <H2>Guest mode</H2>
                <Content>Certainly does not remember your device</Content>
                <Actions>
                    <Button
                        variant="secondary"
                        onClick={() => onStorageModeSelected(device, false)}
                    >
                        Continue in guest mode
                    </Button>
                </Actions>
            </Col>
        </Wrapper>
    );
};

export default StorageMode;
