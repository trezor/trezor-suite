import styled from 'styled-components';

import { useExternalLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { type Network } from '@suite-common/wallet-config';
import {
    type PendingEvmNonceStatus,
    fromWei,
    getFeeRate,
    getTxIcon,
    isEip1559,
    isPending,
} from '@suite-common/wallet-utils';
import {
    Card,
    Divider,
    Grid,
    H3,
    Icon,
    InfoItem,
    type InfoItemProps,
    InfoSegments,
    Link,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { CoinLogo, FeeRate } from '@trezor/product-components';
import { borders, spacings, spacingsPx } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { FormattedDateWithBullet } from 'src/components/suite/FormattedDateWithBullet';
import { TransactionHeader } from 'src/components/wallet/TransactionItem/TransactionHeader';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { type WalletAccountTransaction } from 'src/types/wallet';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

const IconWrapper = styled.div`
    display: flex;
    position: relative;
    border: ${spacingsPx.xxs} solid ${({ theme }) => theme.elementBorderNeutralSofter};
    border-radius: ${borders.radii.full};
`;

const NestedIconWrapper = styled.div`
    position: absolute;
    top: -${spacingsPx.xxs};
    right: -${spacingsPx.xxs};
    background: ${({ theme }) => theme.elementFillElevated};
    border-radius: ${borders.radii.full};
    padding: ${spacingsPx.xxxs};
`;

const Item = ({ label, iconName, children }: Partial<InfoItemProps>) => (
    <InfoItem
        label={label}
        iconName={iconName}
        labelWidth={135}
        typographyStyle="body-xs"
        direction="row"
        verticalAlignment="start"
        ellipsisLineCount={2}
    >
        <Text as="div" typographyStyle="body-xs">
            {children}
        </Text>
    </InfoItem>
);

type BasicTxDetailsProps = {
    tx: WalletAccountTransaction;
    network: Network;
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
    network,
    explorerUrl,
    explorerUrlQueryString,
    nonceStatus,
    nextNonce,
}: BasicTxDetailsProps) => {
    const { isBelowTablet } = useLayoutSize();
    const explorerLink = useExternalLink(`${explorerUrl}${tx.txid}${explorerUrlQueryString ?? ''}`);
    // all solana txs which are fetched are already confirmed
    const isConfirmed = confirmations > 0 || tx.solanaSpecific?.status === 'confirmed';

    return (
        <Card>
            <Row gap={spacings.sm}>
                <IconWrapper>
                    <CoinLogo symbol={tx.symbol} size={48} type="tokenWithNetwork" />
                    <NestedIconWrapper>
                        <Icon
                            size={14}
                            intent={tx.type === 'failed' ? 'critical' : 'neutral'}
                            name={getTxIcon(tx, false)}
                        />
                    </NestedIconWrapper>
                </IconWrapper>

                <H3 ellipsisLineCount={1}>
                    <TransactionHeader transaction={tx} isPending={isPending(tx)} />
                </H3>

                <Row gap={spacings.xxs} margin={{ left: 'auto' }}>
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
                <Item
                    label={
                        isConfirmed ? (
                            <Translation id="TR_MINED_TIME" />
                        ) : (
                            <Translation id="TR_FIRST_SEEN" />
                        )
                    }
                    iconName="calendar"
                >
                    {tx.blockTime ? (
                        <FormattedDateWithBullet value={new Date(tx.blockTime * 1000)} />
                    ) : (
                        <Translation id="TR_UNKNOWN_CONFIRMATION_TIME" />
                    )}
                </Item>

                {/* Fee level */}
                {network.networkType === 'bitcoin' && (
                    <Item label={<Translation id="TR_FEE_RATE" />} iconName="receipt">
                        {/* tx.feeRate was added in @trezor/blockchain-link 2.1.5 meaning that users
                            might have locally saved old transactions without this field. since we
                            cant reliably migrate this data, we are keeping old way of displaying feeRate in place */}
                        <FeeRate
                            feeRate={tx?.feeRate ? tx.feeRate : getFeeRate(tx)}
                            networkType="bitcoin"
                        />
                    </Item>
                )}

                {/* Ethereum */}
                {network.networkType === 'ethereum' && tx.ethereumSpecific && (
                    <>
                        <Item label={<Translation id="TR_NONCE" />} iconName="receipt">
                            <Row gap={4}>
                                {tx.ethereumSpecific?.nonce}
                                {nonceStatus && nonceStatus !== 'ok' && (
                                    <Tooltip
                                        content={
                                            nonceStatus === 'superseded' ? (
                                                <Translation
                                                    id="TR_PENDING_NONCE_SUPERSEDED_WARNING"
                                                    values={{ nonce: nextNonce }}
                                                />
                                            ) : (
                                                <Translation
                                                    id="TR_BUMP_FEE_NONCE_GAP_WARNING"
                                                    values={{ nonce: nextNonce }}
                                                />
                                            )
                                        }
                                    >
                                        <Icon name="warning" size={16} intent="warning" />
                                    </Tooltip>
                                )}
                            </Row>
                        </Item>

                        <Item
                            label={
                                <Translation
                                    id={
                                        tx.ethereumSpecific.gasUsed
                                            ? 'TR_GAS_LIMIT_AND_USAGE'
                                            : 'TR_GAS_LIMIT'
                                    }
                                />
                            }
                            iconName="gasPump"
                        >
                            {tx.ethereumSpecific.gasLimit}
                            {tx.ethereumSpecific.gasUsed && tx.ethereumSpecific.gasLimit && (
                                <>
                                    {' / '}
                                    {tx.ethereumSpecific.gasUsed} (
                                    {new BigNumber(tx.ethereumSpecific.gasUsed)
                                        .div(tx.ethereumSpecific.gasLimit)
                                        .multipliedBy(100)
                                        .toFixed(2)}
                                    %)
                                </>
                            )}
                        </Item>

                        <Item label={<Translation id="TR_GAS_PRICE" />} iconName="gasPump">
                            {isConfirmed || !isEip1559(tx.ethereumSpecific) ? (
                                <FeeRate
                                    feeRate={fromWei(tx.ethereumSpecific?.gasPrice || '0').toGwei()}
                                    networkType="ethereum"
                                    preserveDecimals
                                />
                            ) : (
                                <Translation id="TR_UNCONFIRMED_TX" />
                            )}
                        </Item>

                        {tx.ethereumSpecific.maxFeePerGas && (
                            <>
                                <Item
                                    label={<Translation id="TR_MAX_FEE_PER_GAS" />}
                                    iconName="gasPump"
                                >
                                    <FeeRate
                                        feeRate={fromWei(
                                            tx.ethereumSpecific?.maxFeePerGas ?? '0',
                                        ).toGwei()}
                                        networkType="ethereum"
                                        preserveDecimals
                                    />
                                </Item>

                                <Item
                                    label={<Translation id="TR_BLOCK_BASE_FEE" />}
                                    iconName="gasPump"
                                >
                                    {isConfirmed ? (
                                        <FeeRate
                                            feeRate={fromWei(
                                                tx.ethereumSpecific.baseFeePerGas || '0',
                                            ).toGwei()}
                                            networkType="ethereum"
                                            preserveDecimals
                                        />
                                    ) : (
                                        <Translation id="TR_UNCONFIRMED_TX" />
                                    )}
                                </Item>

                                <Item
                                    label={<Translation id="TR_MAX_PRIORITY_FEE_PER_GAS" />}
                                    iconName="gasPump"
                                >
                                    <FeeRate
                                        feeRate={fromWei(
                                            tx.ethereumSpecific?.maxPriorityFeePerGas ?? '0',
                                        ).toGwei()}
                                        networkType="ethereum"
                                        preserveDecimals
                                    />
                                </Item>
                            </>
                        )}
                    </>
                )}

                {tx.rippleSpecific && (
                    <Item label={<Translation id="DESTINATION_TAG_SHORT" />} iconName="tag">
                        {tx.rippleSpecific.destinationTag ?? '-'}
                    </Item>
                )}

                {tx.stellarSpecific?.memo && (
                    <Item label={<Translation id="DESTINATION_TAG_SHORT" />} iconName="tag">
                        <BlurUrls text={tx.stellarSpecific.memo} />
                    </Item>
                )}

                {tx.solanaSpecific?.memo && (
                    <Item label={<Translation id="MEMO" />} iconName="tag">
                        <BlurUrls text={tx.solanaSpecific.memo} />
                    </Item>
                )}

                {/* TX ID */}
                <Item label={<Translation id="TR_TXID" />} iconName="fingerprint">
                    <Link
                        href={explorerLink}
                        data-testid="@tx-detail/txid-value"
                        overflowWrap="anywhere"
                    >
                        {tx.txid}
                    </Link>
                </Item>

                {tx.tronSpecific?.energyUsage && (
                    <Item label={<Translation id="TR_TRON_ENERGY" />} iconName="gasPump">
                        {tx.tronSpecific.energyUsage}
                    </Item>
                )}

                {tx.tronSpecific?.bandwidthUsage && (
                    <Item label={<Translation id="TR_TRON_BANDWIDTH" />} iconName="gasPump">
                        {tx.tronSpecific.bandwidthUsage}
                    </Item>
                )}

                {tx.tronSpecific?.note && (
                    <Item label={<Translation id="TR_TRON_NOTE" />} iconName="pencil">
                        {tx.tronSpecific.note}
                    </Item>
                )}
            </Grid>
        </Card>
    );
};
