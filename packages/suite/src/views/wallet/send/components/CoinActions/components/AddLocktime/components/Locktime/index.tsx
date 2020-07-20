import { QuestionTooltip, Translation } from '@suite-components';
import { useSendFormContext } from '@wallet-hooks';
import { Input, Icon } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const Row = styled.div``;

const Wrapper = styled.div`
    display: flex;
    flex: 1;
`;

interface Props {
    setIsActive: (isActive: boolean) => void;
}

export default ({ setIsActive }: Props) => {
    const {
        token,
        setSelectedFee,
        initialSelectedFee,
        outputs,
        fiatRates,
        register,
        errors,
        getValues,
        setValue,
        clearError,
        setError,
    } = useSendFormContext();

    return (
        <Wrapper>
            <Row>
                <Input
                    name="locktime"
                    label={
                        <Label>
                            <Icon icon="CALENDAR" size={16} />
                            <Text>
                                <Translation id="TR_SEND_DATA" />
                            </Text>
                            <QuestionTooltip messageId="TR_SEND_DATA_TOOLTIP" />
                        </Label>
                    }
                    labelRight={
                        <StyledIcon size={20} icon="CROSS" onClick={() => setIsActive(false)} />
                    }
                />
            </Row>
            <Row>a</Row>
        </Wrapper>
    );
};
