import { KycError, KycFailed, KycInProgress } from 'src/views/wallet/coinmarket/common';
import { useSavingsPaymentInfo } from 'src/hooks/wallet/useCoinmarketSavingsPaymentInfo';
import { Button } from '@trezor/components';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { useFormatters } from '@suite-common/formatters';
import { CoinmarketReauthorizationCard } from '../CoinmarketReauthorizationCard';
import { withCoinmarket, WithCoinmarketProps } from '../withCoinmarket';

const Header = styled.div`
    font-size: 24px;
    line-height: 30px;
`;

const Description = styled.div`
    font-size: 14px;
    line-height: 24px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-bottom: 13px;
`;

const Divider = styled.div`
    height: 1px;
    width: 100%;
    border: 1px solid ${({ theme }) => theme.BG_GREY};
`;

const Setup = styled.div`
    margin: 9px 0;
    display: flex;
    flex-flow: row nowrap;
    place-content: stretch space-between;
    align-items: stretch;
`;
const Values = styled.div`
    font-size: 16px;
    line-height: 24px;
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

const PaymentInfoOverview = styled.div`
    margin: 15px 0;
    display: flex;
    flex-flow: row nowrap;
    place-content: stretch space-between;
    align-items: stretch;
`;

const PaymentInfoItem = styled.div`
    margin-bottom: 12px;
`;
const PaymentInfoItemLabel = styled.div`
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

const PaymentInfo = (props: WithCoinmarketProps) => {
    const { FiatAmountFormatter } = useFormatters();
    const {
        handleEditButtonClick,
        handleSubmit,
        copyPaymentInfo,
        isSubmitting,
        isWatchingKYCStatus,
        isSavingsTradeLoading,
        savingsTrade,
        kycFinalStatus,
        selectedProviderName,
    } = useSavingsPaymentInfo(props);

    const reauthorizationUrl = savingsTrade?.reauthorizationUrl;

    if (isSavingsTradeLoading || !savingsTrade) {
        return <Translation id="TR_LOADING" />;
    }

    return (
        <>
            {reauthorizationUrl && (
                <CoinmarketReauthorizationCard reauthorizationUrl={reauthorizationUrl} />
            )}
            {isWatchingKYCStatus && <KycInProgress />}
            {!isWatchingKYCStatus && kycFinalStatus === 'Failed' && (
                <KycFailed providerName={selectedProviderName} />
            )}
            {!isWatchingKYCStatus && kycFinalStatus === 'Error' && <KycError />}
            <Header>
                <Translation id="TR_SAVINGS_PAYMENT_INFO_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_PAYMENT_INFO_DESCRIPTION" />
            </Description>
            <Divider />
            <Setup>
                <Values>
                    {savingsTrade.paymentFrequency},{' '}
                    <FiatAmountFormatter
                        value={savingsTrade?.fiatStringAmount || 0}
                        currency={savingsTrade?.fiatCurrency}
                        minimumFractionDigits={0}
                        maximumFractionDigits={2}
                    />
                </Values>
                <Button variant="tertiary" onClick={handleEditButtonClick}>
                    <Translation id="TR_EDIT" />
                </Button>
            </Setup>
            <Divider />
            <PaymentInfoOverview>
                <div>
                    <PaymentInfoItem>
                        <PaymentInfoItemLabel>
                            <Translation id="TR_SAVINGS_PAYMENT_INFO_NAME_LABEL" />
                        </PaymentInfoItemLabel>
                        <PaymentInfoItemValue>
                            {savingsTrade?.paymentInfo?.name}
                            <CopyButton variant="tertiary" onClick={() => copyPaymentInfo('name')}>
                                <Translation id="TR_COPY_TO_CLIPBOARD" />
                            </CopyButton>
                        </PaymentInfoItemValue>
                    </PaymentInfoItem>
                    <PaymentInfoItem>
                        <PaymentInfoItemLabel>
                            <Translation id="TR_SAVINGS_PAYMENT_INFO_IBAN_LABEL" />
                        </PaymentInfoItemLabel>
                        <PaymentInfoItemValue>
                            {savingsTrade?.paymentInfo?.iban}{' '}
                            <CopyButton variant="tertiary" onClick={() => copyPaymentInfo('iban')}>
                                <Translation id="TR_COPY_TO_CLIPBOARD" />
                            </CopyButton>
                        </PaymentInfoItemValue>
                    </PaymentInfoItem>
                    <PaymentInfoItem>
                        <PaymentInfoItemLabel>
                            <Translation id="TR_SAVINGS_PAYMENT_INFO_BIC_LABEL" />
                        </PaymentInfoItemLabel>
                        <PaymentInfoItemValue>
                            {savingsTrade?.paymentInfo?.bic}{' '}
                            <CopyButton variant="tertiary" onClick={() => copyPaymentInfo('bic')}>
                                <Translation id="TR_COPY_TO_CLIPBOARD" />
                            </CopyButton>
                        </PaymentInfoItemValue>
                    </PaymentInfoItem>
                    <PaymentInfoItem>
                        <PaymentInfoItemLabel>
                            <Translation id="TR_SAVINGS_PAYMENT_INFO_DESCRIPTION_LABEL" />
                        </PaymentInfoItemLabel>
                        <PaymentInfoItemValue>
                            {savingsTrade?.paymentInfo?.description}{' '}
                            <CopyButton
                                variant="tertiary"
                                onClick={() => copyPaymentInfo('description')}
                            >
                                <Translation id="TR_COPY_TO_CLIPBOARD" />
                            </CopyButton>
                        </PaymentInfoItemValue>
                    </PaymentInfoItem>
                </div>
            </PaymentInfoOverview>
            <Button onClick={handleSubmit} isDisabled={isSubmitting} isLoading={isSubmitting}>
                <Translation id="TR_CONFIRM" />
            </Button>
        </>
    );
};

export default withCoinmarket(PaymentInfo, {
    title: 'TR_NAV_INVITY',
});
