import React from 'react';
import styled from 'styled-components';
import { Icon, useTheme } from '@trezor/components';
import { Translation } from 'src/components/suite';

const SuccessWrapper = styled.div`
    height: 100%;
    padding: 0 0 20px 0;
`;
const Top = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
`;
const IconWrapper = styled.div`
    height: 75px;
    width: 75px;
    margin-bottom: 35px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px solid ${({ theme }) => theme.STROKE_LIGHT_GREY};
    border-radius: 75px;
    padding: 2px 0 0px 2px;
`;
const Message = styled.div`
    font-size: 24px;
    font-weight: 600;
`;

const Success = () => {
    const theme = useTheme();
    return (
        <SuccessWrapper>
            <Top>
                <IconWrapper>
                    <Icon icon="CHECK" size={38} color={theme.TYPE_GREEN} />
                </IconWrapper>
                <Message>
                    <Translation id="TR_SENT_SUCCESSFULLY" />
                </Message>
            </Top>
        </SuccessWrapper>
    );
};

export default Success;
