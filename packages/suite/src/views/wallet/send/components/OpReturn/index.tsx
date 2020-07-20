import React from 'react';
import styled from 'styled-components';
import { useSendFormContext } from '@wallet-hooks';
import { Card, Translation } from '@suite-components';
import { Input, Icon } from '@trezor/components';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: row;
    justify-items: space-between;
    align-items: center;
    min-height: 86px;
    padding: 32px 42px 10px 42px;
    margin-bottom: 25px;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    padding: 0 4px;
`;

const Space = styled.div`
    display: flex;
    justify-content: center;
    min-width: 65px;
`;

interface Props {
    setIsActive: (siActive: boolean) => void;
}

export default ({ setIsActive }: Props) => {
    const {
        account: { symbol },
        transactionInfo,
    } = useSendFormContext();

    const inputTextName = 'BtcOpReturnText';
    const inputHexName = 'BtcOpReturnHex';

    return (
        <StyledCard>
            <Input
                name={inputTextName}
                label={
                    <Label>
                        <Icon size={16} icon="ASTERISK" />
                        <Text>
                            <Translation id="TR_OP_RETURN" />
                        </Text>
                    </Label>
                }
            />
            <Space> = </Space>
            <Input
                name={inputHexName}
                labelRight={
                    <StyledIcon size={20} icon="CROSS" onClick={() => setIsActive(false)} />
                }
            />
        </StyledCard>
    );
};
