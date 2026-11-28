import { HiddenPlaceholder, RedactNumericalValue } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { Divider, type Padding, Row, Text } from '@trezor/components';
import { LIDO_WITHDRAWAL_NFT } from '@trezor/network-ethereum-suite-common';
import { useNow } from '@trezor/react-utils';

const DAY_IN_MS = 86_400_000;
const REFRESH_INTERVAL_MS = 60_000;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ROW_PADDING = { vertical: 16, horizontal: 20 } satisfies Padding;

type LidoWithdrawalSummaryProps = {
    transaction: WalletAccountTransaction | null;
    withdrawalQueue: string;
    beneficiary: string;
    withdrawalDays: number | null;
};

export const LidoWithdrawalSummary = ({
    transaction,
    withdrawalQueue,
    beneficiary,
    withdrawalDays,
}: LidoWithdrawalSummaryProps) => {
    const now = useNow(withdrawalDays === null ? null : REFRESH_INTERVAL_MS);
    const beneficiaryAddress = beneficiary.toLowerCase();
    const nftIds = (transaction?.tokens ?? [])
        .filter(
            token =>
                token.standard === 'ERC721' &&
                token.contract.toLowerCase() === withdrawalQueue &&
                token.from === ZERO_ADDRESS &&
                token.to.toLowerCase() === beneficiaryAddress,
        )
        .map(token => `#${token.amount}`);

    const elapsedDays = transaction?.blockTime
        ? Math.max(0, now - transaction.blockTime * 1000) / DAY_IN_MS
        : 0;
    const days = withdrawalDays === null ? null : Math.ceil(withdrawalDays - elapsedDays);

    return (
        <>
            <Row justifyContent="space-between" alignItems="center" padding={ROW_PADDING} gap={12}>
                <Text typographyStyle="body-md">
                    <Translation id="TR_EXPLORER_NFT" />
                </Text>
                <Text typographyStyle="body-md" align="end">
                    {LIDO_WITHDRAWAL_NFT.name}
                    {nftIds.length > 0 && (
                        <>
                            {' '}
                            <HiddenPlaceholder>
                                <RedactNumericalValue value={nftIds.join(', ')} />
                            </HiddenPlaceholder>
                        </>
                    )}
                </Text>
            </Row>

            <Divider color="borderNeutral" margin={0} />

            <Row justifyContent="space-between" alignItems="center" padding={ROW_PADDING} gap={12}>
                <Text typographyStyle="body-md">
                    <Translation id="TR_EARN_LIDO_READY_TO_CLAIM_IN" />
                </Text>
                <Text typographyStyle="body-md" align="end">
                    {days !== null && days > 0 ? (
                        <Translation id="TR_EARN_LIDO_CLAIM_ESTIMATE_DAYS" values={{ days }} />
                    ) : (
                        <Translation id="TR_EARN_LIDO_CLAIM_ESTIMATE_UNAVAILABLE" />
                    )}
                </Text>
            </Row>
        </>
    );
};
