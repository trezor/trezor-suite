import React from 'react';
import { Translation } from '@suite-components';
import { useSendFormContext } from '@wallet-hooks';
import { Icon, Input, Switch, variables, colors } from '@trezor/components';
import styled from 'styled-components';

const Wrapper = styled.div`
    margin-bottom: 25px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    padding: 0 4px;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const RbfMessage = styled.div`
    display: flex;
    flex: 1;
    margin-top: 10px;
`;

const Left = styled.div`
    padding-right: 5px;
`;

const Center = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    max-width: 40px;
`;

const Title = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const Description = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

interface Props {
    setIsActive: (isActive: boolean) => void;
}

export default ({ setIsActive }: Props) => {
    const { account, errors } = useSendFormContext();

    const inputName = 'btcLocktime';
    const error = errors[inputName];

    return (
        <Wrapper>
            <Input
                name={inputName}
                label={
                    <Label>
                        <Icon size={16} icon="CALENDAR" />
                        <Text>
                            <Translation id="TR_SCHEDULE_SEND" />
                        </Text>
                    </Label>
                }
                labelRight={
                    <StyledIcon size={20} icon="CROSS" onClick={() => setIsActive(false)} />
                }
            />
            <RbfMessage>
                <Left>
                    <Icon size={16} icon="RBF" />
                </Left>
                <Center>
                    <Title>
                        <Translation id="TR_RBF_OFF_TITLE" />
                    </Title>
                    <Description>
                        <Translation id="TR_RBF_OFF_DESCRIPTION" />
                    </Description>
                </Center>
                <Right>
                    <Switch disabled checked={false} onChange={() => {}} />
                </Right>
            </RbfMessage>
        </Wrapper>
    );
};
