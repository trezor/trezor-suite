import styled from 'styled-components';

import { useExternalLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type PendingEvmNonceStatus, isPending } from '@suite-common/wallet-utils';
import {
    Card,
    Divider,
    Grid,
    H3,
    Icon,
    IconButton,
    InfoSegments,
    Link,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { copyToClipboard } from '@trezor/dom-utils';
import { CalendarIcon, CopyIcon, FingerprintIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { FormattedDateWithBullet } from '#src/components/suite/FormattedDateWithBullet';
import { TransactionHeader } from '#src/components/wallet/TransactionItem/TransactionHeader';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';
import { type WalletAccountTransaction } from '#src/types/wallet';
import { getTransactionIcon } from '#src/utils/wallet/transactionIconUtils';

import { TransactionFacts } from './TransactionFacts/TransactionFacts';
import { TxDetailItem } from './TxDetailItem';

const IconWrapper = styled.div`
    display: flex;
    position: relative;
    border: 4px solid ${({ theme }) => theme.elementBorderNeutralSofter};
    border-radius: calc(infinity * 1px);
`;

const NestedIconWrapper = styled.div`
    position: absolute;
    top: -4px;
    right: -4px;
    background: ${({ theme }) => theme.elementFillElevated};
    border-radius: calc(infinity * 1px);
    padding: 2px;
`;

type BasicTxDetailsProps = {
    tx: WalletAccountTransaction;
    confirmations: number;
    explorerUrl: string;
    explorerUrlQueryString?: string;
    // Whether this tx's own nonce is stuck (gapped or already superseded) — see useEvmNonceInfo.
    nonceStatus?: PendingEvmNonceStatus;
    nextNonce?: number;
};

export const BasicTxDetails = ({
    tx,
    confirmations,
    explorerUrl,
    explorerUrlQueryString,
    nonceStatus,
    nextNonce,
}: BasicTxDetailsProps) => {
    const { dispatch } = useServices(injectDispatch);

    const { isBelowTablet } = useLayoutSize();
    const explorerLink = useExternalLink(`${explorerUrl}${tx.txid}${explorerUrlQueryString ?? ''}`);
    // all solana txs which are fetched are already confirmed
    const isConfirmed = confirmations > 0 || tx.solanaSpecific?.status === 'confirmed';

    const onTxIdCopy = () => {
        copyToClipboard(tx.txid);
        dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
    };

    return (
        <Card>
            <Row gap={12}>
                <IconWrapper>
                    <TokenIcon symbol={tx.symbol} size={48} showNetworkIcon />
                    <NestedIconWrapper>
                        <Icon
                            size={14}
                            intent={tx.type === 'failed' ? 'critical' : 'neutral'}
                            as={getTransactionIcon(tx, false)}
                        />
                    </NestedIconWrapper>
                </IconWrapper>

                <H3 ellipsisLineCount={1}>
                    <TransactionHeader transaction={tx} isPending={isPending(tx)} />
                </H3>

                <Row gap={4} margin={{ left: 'auto' }}>
                    {isConfirmed ? (
                        <InfoSegments
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                        >
                            <Text
                                typographyStyle="body-sm-strong"
                                intent="brand"
                                data-testid="@modal/tx-details/confirmed"
                            >
                                <Translation id="TR_CONFIRMED_TX" />
                            </Text>
                            {confirmations > 0 ? (
                                <Translation
                                    id="TR_TX_CONFIRMATIONS"
                                    values={{ confirmationsCount: confirmations }}
                                />
                            ) : undefined}
                        </InfoSegments>
                    ) : (
                        <Text
                            typographyStyle="body-sm-strong"
                            intent="warning"
                            data-testid="@modal/tx-details/unconfirmed"
                        >
                            <Translation id="TR_UNCONFIRMED_TX" />
                        </Text>
                    )}
                </Row>
            </Row>

            <Divider />

            <Grid columns={isBelowTablet ? 1 : 2} columnGap={32} rowGap={12} forceEqualColumns>
                {/* MINED TIME */}
                <TxDetailItem
                    label={
                        isConfirmed ? (
                            <Translation id="TR_MINED_TIME" />
                        ) : (
                            <Translation id="TR_FIRST_SEEN" />
                        )
                    }
                    icon={CalendarIcon}
                >
                    {tx.blockTime ? (
                        <FormattedDateWithBullet value={new Date(tx.blockTime * 1000)} />
                    ) : (
                        <Translation id="TR_UNKNOWN_CONFIRMATION_TIME" />
                    )}
                </TxDetailItem>

                {/* Network-specific facts, such as the fee rate, gas or a memo */}
                <TransactionFacts
                    tx={tx}
                    isConfirmed={isConfirmed}
                    context={{ nonceStatus, nextNonce }}
                />

                {/* TX ID */}
                <TxDetailItem label={<Translation id="TR_TXID" />} icon={FingerprintIcon}>
                    <Tooltip
                        content={
                            <Row gap={8}>
                                {tx.txid}
                                <IconButton
                                    icon={CopyIcon}
                                    size="small"
                                    intent="neutral"
                                    priority="secondary"
                                    onClick={onTxIdCopy}
                                    tooltip={{ isActive: false }}
                                />
                            </Row>
                        }
                    >
                        <Link
                            href={explorerLink}
                            data-testid="@tx-detail/txid-value"
                            overflowWrap="anywhere"
                        >
                            {tx.txid}
                        </Link>
                    </Tooltip>
                </TxDetailItem>
            </Grid>
        </Card>
    );
};
