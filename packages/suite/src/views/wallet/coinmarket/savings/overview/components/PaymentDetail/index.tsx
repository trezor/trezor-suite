import React, { useState } from 'react';
import { ReactSVG } from 'react-svg';
import parseISO from 'date-fns/parseISO';
import format from 'date-fns/format';
import styled from 'styled-components';
import { Button, Icon } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/build';
import { Translation } from '@suite-components';
import type { SavingsTradePayment } from '@suite-services/invityAPI';
import type { ExtendedMessageDescriptor } from '@suite/types/suite';

const Label = styled.div`
    font-size: 14px;
    line-height: 22px;
    font-weight: 600;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    align-content: stretch;
    margin-bottom: 13px;
`;

const IconWrapper = styled.div`
    margin-right: 6px;
`;

const PaymentItem = styled.div`
    border: 1px solid ${props => props.theme.STROKE_GREY};
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    align-content: stretch;
    justify-content: space-between;
`;

const PaymentItemDate = styled.div`
    margin: 4px 0;
    padding: 9px 38px;
    border-right: 1px solid ${props => props.theme.STROKE_GREY};
`;

const PaymentItemStatus = styled.div`
    margin: 13px 38px;
    color: ${props => props.theme.TYPE_ORANGE};
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const PaymentItemButton = styled(Button)`
    height: 24px;
    margin: 12px 17px;
    font-size: 12px;
    line-height: 16px;
`;
const PaymentItemStatusIcon = styled.div`
    margin-right: 3px;
    display: flex;
`;
const PaymentItemStatusIconReactSVG = styled(ReactSVG)`
    & div {
        display: flex;
    }
    & path {
        fill: ${props => props.theme.TYPE_ORANGE};
    }
`;

const PaymentInfoItem = styled.div`
    justify-content: space-between;
    margin: 14px 35px;
    width: calc(50% - 70px);
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
const Row = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    ${PaymentItem} &:nth-child(2) {
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
    }
`;

const DetailRow = styled(Row)`
    flex-wrap: wrap;
`;

interface PaymentDetail {
    savingsTradePayment: SavingsTradePayment;
    title: ExtendedMessageDescriptor['id'];
}

export const PaymentDetail = ({ savingsTradePayment, title }: PaymentDetail) => {
    const [showDetail, setShowDetail] = useState(false);
    return (
        <>
            <Label>
                <IconWrapper>
                    <Icon icon="CALENDAR" size={14} />
                </IconWrapper>
                <div>
                    <Translation id={title} />
                </div>
            </Label>
            <PaymentItem>
                <Row>
                    <PaymentItemDate>
                        {format(parseISO(savingsTradePayment.plannedPaymentAt), 'dd MMM yyyy')}
                    </PaymentItemDate>
                    <PaymentItemStatus>
                        <PaymentItemStatusIcon>
                            <PaymentItemStatusIconReactSVG
                                src={resolveStaticPath('images/svg/hourglass.svg')}
                            />
                        </PaymentItemStatusIcon>
                        next up
                    </PaymentItemStatus>
                    <PaymentItemButton type="button" onClick={() => setShowDetail(!showDetail)}>
                        <Translation
                            id={
                                showDetail
                                    ? 'TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_HIDE_PAYMENT_DETAILS_BUTTON_LABEL'
                                    : 'TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_VIEW_PAYMENT_DETAILS_BUTTON_LABEL'
                            }
                        />
                    </PaymentItemButton>
                </Row>
                {showDetail && (
                    <>
                        <DetailRow>
                            <PaymentInfoItem>
                                <PaymentInfoItemLabel>
                                    <Translation id="TR_SAVINGS_PAYMENT_INFO_NAME_LABEL" />
                                </PaymentInfoItemLabel>
                                <PaymentInfoItemValue>
                                    {savingsTradePayment.paymentInfo.name}
                                    <CopyButton variant="tertiary" onClick={() => null}>
                                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                                    </CopyButton>
                                </PaymentInfoItemValue>
                            </PaymentInfoItem>
                            <PaymentInfoItem>
                                <PaymentInfoItemLabel>
                                    <Translation id="TR_SAVINGS_PAYMENT_INFO_IBAN_LABEL" />
                                </PaymentInfoItemLabel>
                                <PaymentInfoItemValue>
                                    {savingsTradePayment.paymentInfo.iban}{' '}
                                    <CopyButton variant="tertiary" onClick={() => null}>
                                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                                    </CopyButton>
                                </PaymentInfoItemValue>
                            </PaymentInfoItem>
                            <PaymentInfoItem>
                                <PaymentInfoItemLabel>
                                    <Translation id="TR_SAVINGS_PAYMENT_INFO_BIC_LABEL" />
                                </PaymentInfoItemLabel>
                                <PaymentInfoItemValue>
                                    {savingsTradePayment.paymentInfo.bic}{' '}
                                    <CopyButton variant="tertiary" onClick={() => null}>
                                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                                    </CopyButton>
                                </PaymentInfoItemValue>
                            </PaymentInfoItem>
                            <PaymentInfoItem>
                                <PaymentInfoItemLabel>
                                    <Translation id="TR_SAVINGS_PAYMENT_INFO_DESCRIPTION_LABEL" />
                                </PaymentInfoItemLabel>
                                <PaymentInfoItemValue>
                                    {savingsTradePayment.paymentInfo.description}{' '}
                                    <CopyButton variant="tertiary" onClick={() => null}>
                                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                                    </CopyButton>
                                </PaymentInfoItemValue>
                            </PaymentInfoItem>
                        </DetailRow>
                    </>
                )}
            </PaymentItem>
        </>
    );
};
