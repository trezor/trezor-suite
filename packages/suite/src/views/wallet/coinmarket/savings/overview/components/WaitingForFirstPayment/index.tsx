import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { SavingsPaymentMethod } from 'invity-api';

const StyledCard = styled.div`
    background: rgb(239 201 65 / 10%);
    color: #ba9924;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    justify-content: center;
    padding: 12px 20px;
`;

const Header = styled.div`
    font-size: 16px;
    line-height: 28px;
`;
const Description = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: 14px;
    line-height: 18px;
`;

interface WaitingForFirstPaymentProps {
    paymentMethod?: SavingsPaymentMethod;
    providerName?: string;
}

export const WaitingForFirstPayment = ({
    paymentMethod,
    providerName,
}: WaitingForFirstPaymentProps) => {
    const uppercasePaymentMethod = paymentMethod?.toUpperCase() as Uppercase<SavingsPaymentMethod>;

    return (
        <StyledCard>
            <Header>
                <Translation
                    id={`TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_${uppercasePaymentMethod}_PAYMENT_HEADER`}
                    values={{ providerName }}
                />
            </Header>
            <Description>
                <Translation
                    id={`TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_${uppercasePaymentMethod}_PAYMENT_DESCRIPTION`}
                    values={{ providerName }}
                />
            </Description>
        </StyledCard>
    );
};
