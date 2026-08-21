import { AccountLabel } from '@suite/account';
import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { type NetworkType, networks } from '@suite-common/wallet-config';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import {
    type FeeInfo,
    type GeneralPrecomposedTransactionFinal,
    type SendFormDraftKey,
    type StakeType,
} from '@suite-common/wallet-types';
import { asAmountUnit, getFee, unitsToSubunits } from '@suite-common/wallet-utils';
import { Box, IconButton, Note, Row, Text } from '@trezor/components';
import { BroadcastIcon, ClockIcon, ComputerTowerIcon, InfoIcon, ReceiptIcon } from '@trezor/icons';
import { FeeRate, TokenIcon } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { useLocales } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';

import { TransactionReviewEthereumNotes } from './TransactionReviewEthereumNotes';
import { TransactionReviewTronFeeNotes } from './TransactionReviewTronFeeNotes';

const getEstimatedTime = (
    networkType: NetworkType,
    feeInfo: FeeInfo | undefined,
    tx: GeneralPrecomposedTransactionFinal,
): number | undefined => {
    if (!feeInfo) return;

    const matchedFeeLevel = feeInfo.levels.find(item => item.feePerUnit === tx.feePerByte);

    // TODO: estimated EVM time, blocks logic in connect
    if (networkType !== 'bitcoin' || !matchedFeeLevel) return;

    return matchedFeeLevel.blocks * feeInfo.blockTime * 60;
};

const selectSendFormDrafts = (state: AppState) => state.wallet.send.drafts;
const selectCurrentAccountKey = (state: AppState) => state.wallet.selectedAccount.account?.key;

type TransactionReviewSummaryProps = {
    tx: GeneralPrecomposedTransactionFinal;
    account: Account;
    broadcast?: boolean;
    onDetailsClick: () => void;
    stakeType?: StakeType | null;
    timer?: React.JSX.Element;
};

export const TransactionReviewSummary = ({
    tx,
    account,
    broadcast,
    onDetailsClick,
    stakeType,
    timer,
}: TransactionReviewSummaryProps) => {
    const drafts = useSelector(selectSendFormDrafts);
    const currentAccountKey = useSelector(selectCurrentAccountKey) as string;
    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, account.symbol));
    const locale = useLocales();
    const { symbol, networkType } = account;
    const network = networks[symbol];
    const fee = getFee(account.networkType, tx);
    const estimateTime = getEstimatedTime(networkType, rawFeeInfo, tx);
    const connectPopupCall = useSelector(selectConnectPopupCall);
    const isDebug = useSelector(selectIsDebugModeActive);

    const formFeeRate = drafts[currentAccountKey as SendFormDraftKey]?.feePerUnit; // Todo: is this cast correct? https://github.com/trezor/trezor-suite/issues/24918
    const isFeeCustom = drafts[currentAccountKey as SendFormDraftKey]?.selectedFee === 'custom'; // Todo: is this cast correct? https://github.com/trezor/trezor-suite/issues/24918
    const isComposedFeeRateDifferent = isFeeCustom && formFeeRate !== fee;

    const isEthereumNetworkType = networkType === 'ethereum';

    return (
        <>
            <Row justifyContent="space-between">
                <Row columnGap={16} rowGap={4} flexWrap="wrap">
                    <Row gap={4}>
                        <TokenIcon size={16} symbol={symbol} />
                        <AccountLabel
                            account={account}
                            showAccountTypeBadge
                            accountTypeBadgeSize="small"
                            data-testid="@modal/header/account-label"
                        />
                    </Row>

                    {estimateTime !== undefined && (
                        <Note data-testid="@modal/header/estimated-time" icon={ClockIcon}>
                            {'≈ '}
                            <Text data-testid="@modal/header/estimated-time/value">
                                {formatDurationStrict(estimateTime, locale)}
                            </Text>
                        </Note>
                    )}

                    {isEthereumNetworkType && (
                        <TransactionReviewEthereumNotes account={account} tx={tx} />
                    )}

                    {!['ethereum', 'solana', 'tron'].includes(networkType) && (
                        <Note data-testid="@modal/header/fee-rate" icon={ReceiptIcon}>
                            <FeeRate feeRate={fee} networkType={network.networkType} />
                        </Note>
                    )}

                    {networkType === 'tron' && (
                        <TransactionReviewTronFeeNotes tx={tx} account={account} />
                    )}

                    {isComposedFeeRateDifferent && network.networkType === 'bitcoin' && (
                        <Text data-testid="@modal/header/fee-rate-changed">
                            <Translation id="TR_FEE_RATE_CHANGED" />
                        </Text>
                    )}

                    {!stakeType && !broadcast && connectPopupCall?.state !== 'ongoing' && (
                        <Note data-testid="@modal/header/broadcast" icon={BroadcastIcon}>
                            <Translation id="BROADCAST" />
                            {': '}
                            <Text data-testid="@modal/header/broadcast/state" intent="critical">
                                <Translation id="TR_OFF" />
                            </Text>
                        </Note>
                    )}

                    {connectPopupCall?.state === 'ongoing' && (
                        <ConnectCallSource data-testid="@modal/header/connect-source" />
                    )}

                    {tx.inputs.length > 0 && (
                        // TODO: IconButton doesn't take margin even though it should
                        <Box margin={{ left: 'auto' }}>
                            <IconButton
                                onClick={() => onDetailsClick()}
                                data-testid="@modal/header/details-button"
                                intent="neutral"
                                priority="secondary"
                                icon={InfoIcon}
                                tooltip={{
                                    content: <Translation id="TR_TRANSACTION_DETAILS" />,
                                }}
                            />
                        </Box>
                    )}
                </Row>
                {timer}
            </Row>
            {networkType === 'solana' && isDebug && (
                <Row margin={{ top: 8 }} gap={8}>
                    <DebugOnlyBadge />
                    <Note data-testid="@modal/header/cu-limit" icon={ComputerTowerIcon}>
                        CU Limit
                        {': '}
                        <Text data-testid="@modal/header/cu-limit/value">{tx.feeLimit}</Text> CU
                    </Note>
                    <Note data-testid="@modal/header/cu-price" icon={ComputerTowerIcon}>
                        CU Price
                        {': '}
                        <FeeRate
                            feeRate={unitsToSubunits({
                                value: asAmountUnit(new BigNumber(tx.feePerByte)),
                                decimals: -6,
                            })}
                            networkType={network.networkType}
                        />
                        /CU
                    </Note>
                </Row>
            )}
        </>
    );
};
