import { withInvityLayout, WithInvityLayoutProps } from '@wallet-components';
import { useSavingsPaymentInfo } from '@wallet-hooks/coinmarket/savings/useSavingsPaymentInfo';
import { Button } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';
import { FormattedNumber, Translation } from '@suite-components';

const Header = styled.div`
    font-size: 24px;
    line-height: 30px;
`;

const Description = styled.div`
    font-size: 14px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 13px;
`;

const Divider = styled.div`
    height: 1px;
    width: 100%;
    border: 1px solid ${props => props.theme.BG_GREY};
`;

const Setup = styled.div`
    margin: 9px 0;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: stretch;
    align-content: stretch;
`;
const Values = styled.div`
    font-size: 16px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_GREEN};
`;

const PaymentInfoOverview = styled.div`
    margin: 15px 0;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: stretch;
    align-content: stretch;
`;

const PaymentInfoItem = styled.div`
    margin-bottom: 12px;
`;
const PaymentInfoItemLabel = styled.div`
    font-weight: 600;
    font-size: 12px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;
const PaymentInfoItemValue = styled.div`
    display: flex;
    font-size: 14px;
    line-height: 24px;
`;

const CopyButton = styled(Button)`
    margin-left: 8px;
`;

const PaymentInfo = (props: WithInvityLayoutProps) => {
    const {
        paymentFrequency,
        fiatAmount,
        fiatCurrency,
        paymentInfo,
        handleEditButtonClick,
        handleSubmit,
        copy,
    } = useSavingsPaymentInfo(props);

    return (
        <>
            <Header>
                <Translation id="TR_SAVINGS_PAYMENT_INFO_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_PAYMENT_INFO_DESCRIPTION" />
            </Description>
            <Divider />
            <Setup>
                <Values>
                    {paymentFrequency},{' '}
                    <FormattedNumber
                        value={fiatAmount || 0}
                        currency={fiatCurrency}
                        minimumFractionDigits={0}
                        maximumFractionDigits={0}
                    />
                </Values>
                <Button variant="tertiary" onClick={handleEditButtonClick}>
                    <Translation id="TR_EDIT" />
                </Button>
            </Setup>
            <Divider />
            <PaymentInfoOverview>
                <PaymentInfoItem>
                    <PaymentInfoItemLabel>
                        <Translation id="TR_SAVINGS_PAYMENT_INFO_NAME_LABEL" />
                    </PaymentInfoItemLabel>
                    <PaymentInfoItemValue>
                        {paymentInfo?.name}
                        <CopyButton variant="tertiary" onClick={() => copy('name')}>
                            <Translation id="TR_COPY_TO_CLIPBOARD" />
                        </CopyButton>
                    </PaymentInfoItemValue>
                </PaymentInfoItem>
                <PaymentInfoItem>
                    <PaymentInfoItemLabel>
                        <Translation id="TR_SAVINGS_PAYMENT_INFO_IBAN_LABEL" />
                    </PaymentInfoItemLabel>
                    <PaymentInfoItemValue>
                        {paymentInfo?.iban}{' '}
                        <CopyButton variant="tertiary" onClick={() => copy('iban')}>
                            <Translation id="TR_COPY_TO_CLIPBOARD" />
                        </CopyButton>
                    </PaymentInfoItemValue>
                </PaymentInfoItem>
                <PaymentInfoItem>
                    <PaymentInfoItemLabel>
                        <Translation id="TR_SAVINGS_PAYMENT_INFO_BIC_LABEL" />
                    </PaymentInfoItemLabel>
                    <PaymentInfoItemValue>
                        {paymentInfo?.bic}{' '}
                        <CopyButton variant="tertiary" onClick={() => copy('bic')}>
                            <Translation id="TR_COPY_TO_CLIPBOARD" />
                        </CopyButton>
                    </PaymentInfoItemValue>
                </PaymentInfoItem>
                <PaymentInfoItem>
                    <PaymentInfoItemLabel>
                        <Translation id="TR_SAVINGS_PAYMENT_INFO_DESCRIPTION_LABEL" />
                    </PaymentInfoItemLabel>
                    <PaymentInfoItemValue>
                        {paymentInfo?.description}{' '}
                        <CopyButton variant="tertiary" onClick={() => copy('description')}>
                            <Translation id="TR_COPY_TO_CLIPBOARD" />
                        </CopyButton>
                    </PaymentInfoItemValue>
                </PaymentInfoItem>
            </PaymentInfoOverview>
            <Button onClick={handleSubmit}>
                <Translation id="TR_CONFIRM" />
            </Button>
        </>
    );
};

export default withInvityLayout(PaymentInfo, {
    showStepsGuide: true,
});
