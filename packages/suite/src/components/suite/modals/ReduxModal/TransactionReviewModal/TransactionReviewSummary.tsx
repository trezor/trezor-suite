import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { NetworkType, networks } from '@suite-common/wallet-config';
import { FeeInfo, GeneralPrecomposedTransactionFinal, StakeType } from '@suite-common/wallet-types';
import { getFee, isEip1559 } from '@suite-common/wallet-utils';
import { Box, IconButton, Note, Row, Text } from '@trezor/components';
import { CoinLogo, FeeRate } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { AccountLabel, Translation } from 'src/components/suite';
import { useLocales } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { Account } from 'src/types/wallet';

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

type TransactionReviewSummaryProps = {
    tx: GeneralPrecomposedTransactionFinal;
    account: Account;
    broadcast?: boolean;
    onDetailsClick: () => void;
    stakeType?: StakeType | null;
};

export const TransactionReviewSummary = ({
    tx,
    account,
    broadcast,
    onDetailsClick,
    stakeType,
}: TransactionReviewSummaryProps) => {
    const drafts = useSelector(state => state.wallet.send.drafts);
    const { accountLabel } = useSelector(selectLabelingDataForSelectedAccount);
    const currentAccountKey = useSelector(
        state => state.wallet.selectedAccount.account?.key,
    ) as string;
    const fees = useSelector(state => state.wallet.fees);
    const locale = useLocales();
    const { symbol, accountType, index, networkType } = account;
    const network = networks[symbol];
    const fee = getFee(account.networkType, tx);
    const estimateTime = getEstimatedTime(networkType, fees[account.symbol], tx);
    const connectPopupCall = useSelector(selectConnectPopupCall);

    const formFeeRate = drafts[currentAccountKey]?.feePerUnit;
    const isFeeCustom = drafts[currentAccountKey]?.selectedFee === 'custom';
    const isComposedFeeRateDifferent = isFeeCustom && formFeeRate !== fee;

    const isEthereumNetworkType = networkType === 'ethereum';

    return (
        <Row columnGap={spacings.md} rowGap={spacings.xxs} flexWrap="wrap">
            <Row gap={spacings.xxs}>
                <CoinLogo size={14} symbol={symbol} />
                <AccountLabel
                    accountLabel={accountLabel || account.accountLabel}
                    accountType={accountType}
                    symbol={symbol}
                    index={index}
                />
            </Row>

            {estimateTime !== undefined && (
                <Note iconName="clock">
                    {'≈ '}
                    {formatDurationStrict(estimateTime, locale)}
                </Note>
            )}

            {isEthereumNetworkType && (
                <>
                    <Note iconName="gasPump">
                        <Translation id="TR_GAS_LIMIT" />
                        {': '}
                        {tx.feeLimit}
                    </Note>
                    <Note iconName="gasPump">
                        {isEip1559(tx) ? (
                            <Translation id="TR_MAX_FEE_PER_GAS" />
                        ) : (
                            <Translation id="TR_GAS_PRICE" />
                        )}
                        {': '}
                        <FeeRate feeRate={fee} networkType={network.networkType} symbol={symbol} />
                    </Note>
                </>
            )}

            {!['ethereum', 'solana'].includes(networkType) && (
                <Note iconName="receipt">
                    <FeeRate feeRate={fee} networkType={network.networkType} symbol={symbol} />
                </Note>
            )}

            {isComposedFeeRateDifferent && network.networkType === 'bitcoin' && (
                <Translation id="TR_FEE_RATE_CHANGED" />
            )}

            {!stakeType && !broadcast && connectPopupCall?.state !== 'ongoing' && (
                <Note iconName="broadcast">
                    <Translation id="BROADCAST" />
                    {': '}
                    <Text variant="destructive">
                        <Translation id="TR_OFF" />
                    </Text>
                </Note>
            )}

            {connectPopupCall?.state === 'ongoing' && (
                <Note iconName="plug">
                    <Translation id="TR_CONNECTED_TO" />
                    {': '}
                    <Text variant="primary">
                        {connectPopupCall.source?.manifest?.appName ||
                            connectPopupCall.source?.origin}
                    </Text>
                </Note>
            )}

            {tx.inputs.length > 0 && (
                // TODO: IconButton doesn't take margin even though it should
                <Box margin={{ left: 'auto' }}>
                    <IconButton
                        size="tiny"
                        onClick={() => onDetailsClick()}
                        variant="tertiary"
                        icon="info"
                    />
                </Box>
            )}
        </Row>
    );
};
