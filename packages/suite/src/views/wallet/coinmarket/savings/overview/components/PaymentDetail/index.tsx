import { useState } from 'react';
import parseISO from 'date-fns/parseISO';
import format from 'date-fns/format';
import styled from 'styled-components';
import { Button, Icon, Image } from '@trezor/components';
import { Translation } from 'src/components/suite';
import type { SavingsTradePlannedPayment } from 'invity-api';
import type { ExtendedMessageDescriptor } from 'src/types/suite';
import { useCoinmarketSavingsPaymentInfoCopy } from 'src/hooks/wallet/useCoinmarketSavingsPaymentInfoCopy';
import { borders } from '@trezor/theme';

const Wrapper = styled.div`
    margin-top: 18px;
`;

const Label = styled.div`
    font-size: 14px;
    line-height: 22px;
    font-weight: 600;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    align-content: stretch;
    margin-bottom: 13px;
`;

const IconWrapper = styled.div`
    margin-right: 6px;
`;

const PaymentItem = styled.div`
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: ${borders.radii.xs};
    display: flex;
    flex-flow: column nowrap;
    align-items: stretch;
    place-content: stretch space-between;
`;

const PaymentItemDateWrapper = styled.div`
    display: flex;
    margin: 4px 0;
    padding: 9px 38px;
    border-right: 1px solid ${({ theme }) => theme.STROKE_GREY};
    width: 25%;
    align-items: center;
`;

const PaymentItemDate = styled.div`
    width: 100%;
`;

const PaymentItemStatus = styled.div<{ isNextUp: boolean; isPaymentInfoAvailable: boolean }>`
    margin: ${({ isPaymentInfoAvailable }) => (isPaymentInfoAvailable ? '13px 38px' : '0 auto')};
    color: ${({ isNextUp, theme }) => (isNextUp ? theme.TYPE_ORANGE : theme.TYPE_LIGHT_GREY)};
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const PaymentItemButton = styled(Button)`
    margin: 12px 17px;
`;

const PaymentItemStatusIcon = styled.div`
    margin-right: 3px;
    display: flex;
`;

const PaymentItemStatusIconReactSVG = styled(Image)<{ isNextUp: boolean }>`
    & div {
        display: flex;
    }

    & path {
        fill: ${({ isNextUp, theme }) => (isNextUp ? theme.TYPE_ORANGE : theme.TYPE_LIGHT_GREY)};
    }
`;

const PaymentInfoItem = styled.div`
    justify-content: space-between;
    margin: 14px 35px;
    width: calc(50% - 70px);
`;
const PaymentInfoItemLabel = styled.div`
    display: flex;
    font-weight: 600;
    font-size: 12px;
    line-height: 24px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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
    text-align: center;
    ${PaymentItem} &:nth-child(2) {
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    }
`;

const DetailRow = styled(Row)`
    flex-wrap: wrap;
`;

interface PaymentDetailProps {
    savingsTradePayment: SavingsTradePlannedPayment;
    title: ExtendedMessageDescriptor['id'];
    isNextUp?: boolean;
}

export const PaymentDetail = ({
    savingsTradePayment,
    title,
    isNextUp = false,
}: PaymentDetailProps) => {
    const [showDetail, setShowDetail] = useState(false);
    const { copyPaymentInfo } = useCoinmarketSavingsPaymentInfoCopy(
        savingsTradePayment.paymentInfo,
    );

    return (
        <Wrapper>
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
                    <PaymentItemDateWrapper>
                        <PaymentItemDate>
                            {format(parseISO(savingsTradePayment.plannedPaymentAt), 'dd MMM yyyy')}
                        </PaymentItemDate>
                    </PaymentItemDateWrapper>
                    <PaymentItemStatus
                        isNextUp={isNextUp}
                        isPaymentInfoAvailable={!!savingsTradePayment.paymentInfo}
                    >
                        {isNextUp ? (
                            <>
                                <PaymentItemStatusIcon>
                                    <PaymentItemStatusIconReactSVG
                                        isNextUp={isNextUp}
                                        image="HOURGLASS"
                                    />
                                </PaymentItemStatusIcon>
                                <Translation id="TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_CURRENT_PAYMENT_STATUS" />
                            </>
                        ) : (
                            <>
                                <PaymentItemStatusIcon>
                                    <PaymentItemStatusIconReactSVG
                                        isNextUp={isNextUp}
                                        image="WATCH"
                                    />
                                </PaymentItemStatusIcon>
                                <Translation id="TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_NEXT_PAYMENT_STATUS" />
                            </>
                        )}
                    </PaymentItemStatus>
                    {savingsTradePayment.paymentInfo && (
                        <PaymentItemButton
                            type="button"
                            onClick={() => setShowDetail(!showDetail)}
                            size="small"
                        >
                            <Translation
                                id={
                                    showDetail
                                        ? 'TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_HIDE_PAYMENT_DETAILS_BUTTON_LABEL'
                                        : 'TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_VIEW_PAYMENT_DETAILS_BUTTON_LABEL'
                                }
                            />
                        </PaymentItemButton>
                    )}
                </Row>
                {showDetail && (
                    <DetailRow>
                        <PaymentInfoItem>
                            <PaymentInfoItemLabel>
                                <Translation id="TR_SAVINGS_PAYMENT_INFO_NAME_LABEL" />
                            </PaymentInfoItemLabel>
                            <PaymentInfoItemValue>
                                {savingsTradePayment.paymentInfo?.name}
                                <CopyButton
                                    variant="tertiary"
                                    onClick={() => copyPaymentInfo('name')}
                                >
                                    <Translation id="TR_COPY_TO_CLIPBOARD" />
                                </CopyButton>
                            </PaymentInfoItemValue>
                        </PaymentInfoItem>
                        <PaymentInfoItem>
                            <PaymentInfoItemLabel>
                                <Translation id="TR_SAVINGS_PAYMENT_INFO_IBAN_LABEL" />
                            </PaymentInfoItemLabel>
                            <PaymentInfoItemValue>
                                {savingsTradePayment.paymentInfo?.iban}{' '}
                                <CopyButton
                                    variant="tertiary"
                                    onClick={() => copyPaymentInfo('iban')}
                                >
                                    <Translation id="TR_COPY_TO_CLIPBOARD" />
                                </CopyButton>
                            </PaymentInfoItemValue>
                        </PaymentInfoItem>
                        <PaymentInfoItem>
                            <PaymentInfoItemLabel>
                                <Translation id="TR_SAVINGS_PAYMENT_INFO_BIC_LABEL" />
                            </PaymentInfoItemLabel>
                            <PaymentInfoItemValue>
                                {savingsTradePayment.paymentInfo?.bic}{' '}
                                <CopyButton
                                    variant="tertiary"
                                    onClick={() => copyPaymentInfo('bic')}
                                >
                                    <Translation id="TR_COPY_TO_CLIPBOARD" />
                                </CopyButton>
                            </PaymentInfoItemValue>
                        </PaymentInfoItem>
                        <PaymentInfoItem>
                            <PaymentInfoItemLabel>
                                <Translation id="TR_SAVINGS_PAYMENT_INFO_DESCRIPTION_LABEL" />
                            </PaymentInfoItemLabel>
                            <PaymentInfoItemValue>
                                {savingsTradePayment.paymentInfo?.description}{' '}
                                <CopyButton
                                    variant="tertiary"
                                    onClick={() => copyPaymentInfo('description')}
                                >
                                    <Translation id="TR_COPY_TO_CLIPBOARD" />
                                </CopyButton>
                            </PaymentInfoItemValue>
                        </PaymentInfoItem>
                    </DetailRow>
                )}
            </PaymentItem>
        </Wrapper>
    );
};
