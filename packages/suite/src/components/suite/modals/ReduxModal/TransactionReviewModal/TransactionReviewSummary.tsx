import { formatDuration } from '@suite-common/suite-utils';
import { NetworkType, networks } from '@suite-common/wallet-config';
import { FeeInfo, GeneralPrecomposedTransactionFinal, StakeType } from '@suite-common/wallet-types';
import { getFee, getFeeUnits } from '@suite-common/wallet-utils';
import { Box, IconButton, Note, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { AccountLabel, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { Account } from 'src/types/wallet';

const getEstimatedTime = (
    networkType: NetworkType,
    symbolFees: FeeInfo,
    tx: GeneralPrecomposedTransactionFinal,
): number | undefined => {
    const matchedFeeLevel = symbolFees.levels.find(item => item.feePerUnit === tx.feePerByte);

    if (networkType !== 'bitcoin' || !matchedFeeLevel) return;

    return matchedFeeLevel.blocks * symbolFees.blockTime * 60;
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

    const network = networks[account.symbol];
    const { symbol, accountType, index, networkType } = account;
    const fee = getFee(networkType, tx);
    const estimateTime = getEstimatedTime(networkType, fees[account.symbol], tx);

    const formFeeRate = drafts[currentAccountKey]?.feePerUnit;
    const isFeeCustom = drafts[currentAccountKey]?.selectedFee === 'custom';
    const isComposedFeeRateDifferent = isFeeCustom && formFeeRate !== fee;

    return (
        <Row columnGap={spacings.md} rowGap={spacings.xxs} flexWrap="wrap">
            <Row gap={spacings.xxs}>
                <CoinLogo size={14} symbol={symbol} />
                <AccountLabel
                    accountLabel={accountLabel}
                    accountType={accountType}
                    symbol={symbol}
                    index={index}
                />
            </Row>

            {estimateTime !== undefined && (
                <Note iconName="clock">
                    {'≈ '}
                    {formatDuration(estimateTime)}
                </Note>
            )}

            {!!tx.feeLimit && network.networkType !== 'solana' && (
                <Note iconName="gasPump">
                    <Translation id="TR_GAS_LIMIT" />
                    {': '}
                    {tx.feeLimit}
                </Note>
            )}

            {networkType === 'ethereum' ? (
                <Note iconName="gasPump">
                    <Translation id="TR_GAS_PRICE" />
                    {': '}
                    {fee} {getFeeUnits(network.networkType)}
                </Note>
            ) : (
                <Note iconName="receipt">
                    {fee} {getFeeUnits(network.networkType)}
                </Note>
            )}

            {isComposedFeeRateDifferent && network.networkType === 'bitcoin' && (
                <Translation id="TR_FEE_RATE_CHANGED" />
            )}

            {!stakeType && !broadcast && (
                <Note iconName="broadcast">
                    <Translation id="BROADCAST" />
                    {': '}
                    <Text variant="destructive">
                        <Translation id="TR_OFF" />
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
