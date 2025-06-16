import { ReactNode, useEffect, useState } from 'react';
import { usePrevious } from 'react-use';

import styled, { DefaultTheme, keyframes } from 'styled-components';

import {
    TradingExchangeType,
    cryptoIdToNetwork,
    tradingExchangeActions,
    useTradingInfo,
} from '@suite-common/trading';
import { getExplorerUrl } from '@suite-common/wallet-config';
import { Button, Card, Column, Icon, IconVariant, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { TxAddress } from 'src/components/suite/copy/TxAddress';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeWatchSendApproval } from 'src/hooks/wallet/trading/form/useTradingExchangeWatchSendApproval';
import { TradingExchangeApprovalType } from 'src/types/trading/tradingForm';

const TextButton = styled.div<{ $disabled: boolean }>`
    color: ${({ theme, $disabled }) =>
        $disabled ? theme.textDisabled : theme['textPrimaryDefault' as keyof DefaultTheme]};
    cursor: pointer;

    &:hover {
        color: ${({ theme, $disabled }) =>
            $disabled ? theme.textDisabled : theme['textPrimaryPressed' as keyof DefaultTheme]};
    }
`;

const IconWrapper = styled.div`
    background-color: inherit;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateY(4px);
`;

const loadingAnimation = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`;

const LoadingIconWrapper = styled.div`
    animation: ${loadingAnimation} 1s linear infinite;
`;

type IconProps = { variant?: IconVariant };

const IconCheck = ({ variant }: IconProps) => (
    <Icon name="checkCircle" size="medium" variant={variant ?? 'tertiary'} />
);

const IconLoading = ({ variant }: IconProps) => (
    <LoadingIconWrapper>
        <Icon name="spinnerGap" size="medium" variant={variant ?? 'tertiary'} />
    </LoadingIconWrapper>
);

const IconCircle = ({ variant }: IconProps) => (
    <Icon name="circle" size="medium" variant={variant ?? 'tertiary'} />
);

const IconError = ({ variant }: IconProps) => (
    <Icon name="xCircle" size="medium" variant={variant ?? 'destructive'} />
);

const ApprovalStep = ({ label, icon }: { label: ReactNode; icon: ReactNode }) => (
    <Row gap={spacings.sm} alignItems="flex-start">
        <IconWrapper>{icon}</IconWrapper>
        <Paragraph typographyStyle="body" variant="tertiary" align="start">
            {label}
        </Paragraph>
    </Row>
);

type ApprovalStep = 'REQUIRED' | 'APPROVED' | 'LOADING' | 'ERROR';

interface TradingFormApprovalProps {
    openApproveModal: () => void;
    isFetchingApprovalStatus: boolean;
    approvalType: TradingExchangeApprovalType;
    setApprovalType: (approvalType: TradingExchangeApprovalType) => void;
}

export const TradingFormApproval = ({
    openApproveModal,
    isFetchingApprovalStatus,
    approvalType,
    setApprovalType,
}: TradingFormApprovalProps) => {
    const dispatch = useDispatch();
    const context = useTradingFormContext<TradingExchangeType>();

    const {
        selectQuote,
        approveTransaction,
        revokeApproval,
        fetchApprovalStatus,
        selectedQuote,
        watchTradeApproval,
        form: {
            state: { isFormLoading },
        },
    } = context;

    const { cryptoIdToCoinSymbol } = useTradingInfo();

    const preapprovedAmount = selectedQuote?.preapprovedStringAmount;
    const coinSymbol = selectedQuote?.send ? cryptoIdToCoinSymbol(selectedQuote?.send) : undefined;

    const currentQuoteStatus = selectedQuote?.status;
    const previousQuoteStatus = usePrevious(currentQuoteStatus);

    const [isManuallyApproved, setIsManuallyApproved] = useState(false);

    const [isApproveButtonLoading, setIsApproveButtonLoading] = useState(false);
    const [isRevokeButtonLoading, setIsRevokeButtonLoading] = useState(false);
    const [isSwapButtonLoading, setIsSwapButtonLoading] = useState(false);
    const [isRefreshButtonLoading, setIsRefreshButtonLoading] = useState(false);

    const [approvalStep, setApprovalStep] = useState<ApprovalStep>();

    const explorers = useSelector(state => state.wallet.explorer);
    const network = selectedQuote?.send && cryptoIdToNetwork(selectedQuote.send);
    const explorer =
        network?.symbol && (explorers[network.symbol].custom ?? explorers[network.symbol].default);

    useTradingExchangeWatchSendApproval({
        selectedQuote,
        watchTradeApproval,
    });

    useEffect(() => {
        if (currentQuoteStatus === 'ERROR') {
            return setApprovalStep('ERROR');
        }

        if (previousQuoteStatus === undefined || previousQuoteStatus === 'ERROR') {
            if (currentQuoteStatus === 'APPROVAL_REQ') {
                return setApprovalStep('REQUIRED');
            }

            if (currentQuoteStatus === 'CONFIRM') {
                return setApprovalStep('APPROVED');
            }

            if (currentQuoteStatus === 'SIGN_DATA') {
                return setApprovalStep('APPROVED');
            }

            if (currentQuoteStatus === 'APPROVAL_PENDING') {
                return setApprovalStep('LOADING');
            }
        }

        if (previousQuoteStatus === 'APPROVAL_REQ' && currentQuoteStatus === 'CONFIRM') {
            return setApprovalStep('APPROVED');
        }

        if (previousQuoteStatus === 'CONFIRM' && currentQuoteStatus === 'APPROVAL_REQ') {
            return setApprovalStep('REQUIRED');
        }

        if (previousQuoteStatus === 'APPROVAL_REQ' && currentQuoteStatus === 'APPROVAL_PENDING') {
            return setApprovalStep('LOADING');
        }

        if (previousQuoteStatus === 'CONFIRM' && currentQuoteStatus === 'APPROVAL_PENDING') {
            return setApprovalStep('LOADING');
        }

        if (previousQuoteStatus === 'APPROVAL_PENDING' && currentQuoteStatus === 'CONFIRM') {
            setIsManuallyApproved(true);

            if (approvalType === 'REVOKE') {
                return setApprovalStep('REQUIRED');
            }

            if (approvalType === 'APPROVE') {
                return setApprovalStep('APPROVED');
            }
        }

        if (previousQuoteStatus === 'APPROVAL_PENDING' && currentQuoteStatus === 'SIGN_DATA') {
            if (approvalType === 'REVOKE') {
                return setApprovalStep('REQUIRED');
            }

            if (approvalType === 'APPROVE') {
                return setApprovalStep('APPROVED');
            }
        }
    }, [currentQuoteStatus, previousQuoteStatus, approvalType]);

    const onApproveTransactionClick = async () => {
        if (!selectedQuote || !selectedQuote.isDex) {
            return;
        }

        setApprovalType('APPROVE');
        setIsApproveButtonLoading(true);

        await approveTransaction(selectedQuote);

        setIsApproveButtonLoading(false);

        openApproveModal();
    };

    const onRevokeApprovalClick = async () => {
        if (!selectedQuote || !selectedQuote.receiveAddress) {
            return;
        }

        setApprovalType('REVOKE');
        setIsRevokeButtonLoading(true);

        await revokeApproval(selectedQuote);

        setIsRevokeButtonLoading(false);
    };

    const onProceedToSwapClick = () => {
        if (!selectedQuote) {
            return;
        }

        setIsSwapButtonLoading(true);

        dispatch(tradingExchangeActions.setFormStep('RECEIVING_ADDRESS'));
        selectQuote(selectedQuote);

        setIsSwapButtonLoading(false);
    };

    const onRefreshApprovalClick = async () => {
        setIsRefreshButtonLoading(true);

        await fetchApprovalStatus(selectedQuote);

        setIsRefreshButtonLoading(false);
    };

    const isApproveButtonDisabled =
        isApproveButtonLoading ||
        (approvalStep === 'LOADING' && approvalType === 'REVOKE') ||
        isFetchingApprovalStatus ||
        isFormLoading;

    const isSwapButtonDisabled =
        isSwapButtonLoading ||
        (approvalStep === 'LOADING' && approvalType === 'APPROVE') ||
        isFetchingApprovalStatus ||
        isFormLoading;

    const isRevokeButtonDisabled =
        isRevokeButtonLoading ||
        (approvalStep === 'LOADING' && approvalType === 'APPROVE') ||
        isFetchingApprovalStatus ||
        isFormLoading;

    const isRefreshButtonDisabled =
        isRefreshButtonLoading || isFetchingApprovalStatus || isFormLoading;

    return (
        <Column gap={spacings.md} alignItems="center">
            <Card paddingType="none" margin={{ bottom: spacings.md }}>
                <Column
                    margin={{ horizontal: spacings.xxs, vertical: spacings.xxs }}
                    gap={spacings.xxs}
                >
                    <Paragraph
                        typographyStyle="label"
                        variant="tertiary"
                        align="start"
                        margin={{ vertical: spacings.xxs, horizontal: spacings.sm }}
                    >
                        <Translation id="TR_EXCHANGE_APPROVAL_FORM_TITLE" />
                    </Paragraph>

                    <Card>
                        {isFetchingApprovalStatus ? (
                            <Row gap={spacings.sm}>
                                <IconLoading variant="tertiary" />
                                <Paragraph typographyStyle="body" variant="tertiary" align="start">
                                    <Translation id="TR_EXCHANGE_APPROVAL_FORM_CHECKING_APPROVAL_STATUS" />
                                </Paragraph>
                            </Row>
                        ) : (
                            <Column gap={spacings.sm}>
                                {approvalStep === 'REQUIRED' && (
                                    <>
                                        <ApprovalStep
                                            label={
                                                <Translation id="TR_EXCHANGE_APPROVAL_FORM_REQUIRED" />
                                            }
                                            icon={<IconCheck variant="tertiary" />}
                                        />

                                        <ApprovalStep
                                            label={
                                                <Translation id="TR_EXCHANGE_APPROVAL_FORM_READY_TO_SWAP" />
                                            }
                                            icon={<IconCircle variant="tertiary" />}
                                        />
                                    </>
                                )}

                                {approvalStep === 'LOADING' && (
                                    <>
                                        <ApprovalStep
                                            label={
                                                <Column>
                                                    <Translation id="TR_EXCHANGE_APPROVAL_FORM_PENDING_PREFIX" />
                                                    {selectedQuote?.approvalSendTxHash && (
                                                        <TxAddress
                                                            variant="primary"
                                                            typographyStyle="body"
                                                            txAddress={
                                                                selectedQuote.approvalSendTxHash
                                                            }
                                                            explorerUrl={getExplorerUrl(
                                                                explorer,
                                                                'tx',
                                                            )}
                                                            explorerUrlQueryString={
                                                                explorer?.queryString
                                                            }
                                                        />
                                                    )}
                                                    <Translation id="TR_EXCHANGE_APPROVAL_FORM_PENDING_SUFFIX" />
                                                </Column>
                                            }
                                            icon={<IconLoading variant="tertiary" />}
                                        />

                                        <ApprovalStep
                                            label={
                                                <Translation
                                                    id={
                                                        approvalType === 'APPROVE'
                                                            ? 'TR_EXCHANGE_APPROVAL_FORM_READY_TO_SWAP'
                                                            : 'TR_EXCHANGE_APPROVAL_FORM_APPROVAL_REVOKED'
                                                    }
                                                />
                                            }
                                            icon={<IconCircle variant="tertiary" />}
                                        />
                                    </>
                                )}

                                {approvalStep === 'APPROVED' && (
                                    <>
                                        {isManuallyApproved && (
                                            <ApprovalStep
                                                label={
                                                    <Translation id="TR_EXCHANGE_APPROVAL_FORM_TX_PROCESSED" />
                                                }
                                                icon={<IconCheck variant="primary" />}
                                            />
                                        )}

                                        <ApprovalStep
                                            label={
                                                <Translation
                                                    id={
                                                        preapprovedAmount &&
                                                        preapprovedAmount !== '0'
                                                            ? 'TR_EXCHANGE_APPROVAL_FORM_APPROVED'
                                                            : 'TR_EXCHANGE_APPROVAL_FORM_APPROVED_PLAIN'
                                                    }
                                                    values={{
                                                        amount: preapprovedAmount,
                                                        coinSymbol,
                                                    }}
                                                />
                                            }
                                            icon={<IconCheck variant="primary" />}
                                        />
                                    </>
                                )}

                                {approvalStep === 'ERROR' && (
                                    <ApprovalStep
                                        label={<Translation id="TR_EXCHANGE_APPROVAL_ERROR" />}
                                        icon={<IconError variant="destructive" />}
                                    />
                                )}
                            </Column>
                        )}
                    </Card>
                </Column>
            </Card>

            {(approvalStep === 'REQUIRED' ||
                (approvalStep === 'LOADING' && approvalType === 'REVOKE')) && (
                <Button
                    onClick={onApproveTransactionClick}
                    variant="primary"
                    isFullWidth
                    isLoading={isApproveButtonLoading}
                    isDisabled={isApproveButtonDisabled}
                >
                    <Translation id="TR_EXCHANGE_APPROVAL_FORM_APPROVE_BUTTON" />
                </Button>
            )}

            {(approvalStep === 'APPROVED' ||
                (approvalStep === 'LOADING' && approvalType === 'APPROVE')) && (
                <>
                    <Button
                        onClick={onProceedToSwapClick}
                        variant="primary"
                        isFullWidth
                        isLoading={isSwapButtonLoading || isRevokeButtonLoading}
                        isDisabled={isSwapButtonDisabled || isRevokeButtonDisabled}
                    >
                        <Translation id="TR_TRADING_SWAP" />
                    </Button>

                    <TextButton
                        onClick={() =>
                            isRevokeButtonLoading || isSwapButtonLoading
                                ? null
                                : onRevokeApprovalClick()
                        }
                        $disabled={isRevokeButtonDisabled || isSwapButtonDisabled}
                    >
                        <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BUTTON" />
                    </TextButton>
                </>
            )}

            {approvalStep === 'ERROR' && (
                <Button
                    onClick={onRefreshApprovalClick}
                    variant="primary"
                    isFullWidth
                    isLoading={isRefreshButtonLoading}
                    isDisabled={isRefreshButtonDisabled}
                >
                    <Translation id="TR_EXCHANGE_APPROVAL_FORM_REFRESH_BUTTON" />
                </Button>
            )}
        </Column>
    );
};
