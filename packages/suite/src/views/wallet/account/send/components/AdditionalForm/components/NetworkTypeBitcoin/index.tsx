import React from 'react';
import styled from 'styled-components';
import { Props } from './Container';
import CustomFee from '../CustomFee';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    padding: 0 0 30px 0;
    display: flex;

    &:last-child {
        padding: 0;
    }
`;

const NetworkTypeBitcoin = (props: Props) => {
    const { send } = props;
    if (!send) return null;

    return (
        <Wrapper>
            <Row>
                <CustomFee
                    errors={props.send.errors.customFee}
                    customFee={props.send.customFee}
                    sendFormActions={props.sendFormActions}
                />
            </Row>
        </Wrapper>
    );
};

export default NetworkTypeBitcoin;
