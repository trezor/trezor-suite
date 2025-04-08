import styled from 'styled-components';
import { fromWei } from 'web3-utils';

import { Network } from '@suite-common/wallet-config';
import { getFeeRate, getTxIcon, isPending } from '@suite-common/wallet-utils';
import {
    Box,
    Card,
    Divider,
    Grid,
    H3,
    Icon,
    InfoItem,
    InfoItemProps,
    InfoSegments,
    Row,
    Text,
    useElevation,
} from '@trezor/components';
import { CoinLogo, FeeRate } from '@trezor/product-components';
import { Elevation, borders, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { FormattedDateWithBullet, Translation } from 'src/components/suite';
import { IOAddress } from 'src/components/suite/copy/IOAddress';
import { TransactionHeader } from 'src/components/wallet/TransactionItem/TransactionHeader';
import { WalletAccountTransaction } from 'src/types/wallet';

const IconWrapper = styled.div<{ $elevation: Elevation }>`
    display: flex;
    position: relative;
    border: ${spacingsPx.xxs} solid ${mapElevationToBorder};
    border-radius: ${borders.radii.full};
`;

const NestedIconWrapper = styled.div<{ $elevation: Elevation }>`
    position: absolute;
    top: -${spacingsPx.xxs};
    right: -${spacingsPx.xxs};
    background: ${mapElevationToBorder};
    border-radius: ${borders.radii.full};
    padding: ${spacingsPx.xxxs};
`;

const Item = ({ label, iconName, children }: Partial<InfoItemProps>) => (
    <InfoItem
        label={label}
        iconName={iconName}
        labelWidth={120}
        typographyStyle="label"
        direction="row"
        verticalAlignment="start"
    >
        <Box padding={{ top: spacings.xxxs }}>
            <Text as="div" typographyStyle="label">
                {children}
            </Text>
        </Box>
    </InfoItem>
);

type BasicTxDetailsProps = {
    tx: WalletAccountTransaction;
    network: Network;
    confirmations: number;
    explorerUrl: string;
    explorerUrlQueryString?: string;
};

export const BasicTxDetails = ({
    tx,
    confirmations,
    network,
    explorerUrl,
    explorerUrlQueryString,
}: BasicTxDetailsProps) => {
    const { elevation } = useElevation();
    // all solana txs which are fetched are already confirmed
    const isConfirmed = confirmations > 0 || tx.solanaSpecific?.status === 'confirmed';

    return (
        <Card>
            <Row gap={spacings.sm}>
                <IconWrapper $elevation={elevation}>
                    <CoinLogo symbol={tx.symbol} size={48} type="tokenWithNetwork" />
                    <NestedIconWrapper $elevation={elevation}>
                        <Icon
                            size={14}
                            variant={tx.type === 'failed' ? 'destructive' : 'default'}
                            name={getTxIcon(tx.type)}
                        />
                    </NestedIconWrapper>
                </IconWrapper>

                <H3 ellipsisLineCount={1}>
                    <TransactionHeader transaction={tx} isPending={isPending(tx)} />
                </H3>

                <Row gap={spacings.xxs} margin={{ left: 'auto' }}>
                    {isConfirmed ? (
                        <InfoSegments typographyStyle="hint" variant="tertiary">
                            <Text typographyStyle="callout" variant="primary">
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
                        <Text typographyStyle="callout" variant="warning">
                            <Translation id="TR_UNCONFIRMED_TX" />
                        </Text>
                    )}
                </Row>
            </Row>

            <Divider />

            <Grid columns={2} gap={spacings.sm} forceEqualColumns>
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

                {/* TX ID */}
                <Item label={<Translation id="TR_TXID" />} iconName="fingerprint">
                    <IOAddress
                        txAddress={tx.txid}
                        explorerUrl={explorerUrl}
                        explorerUrlQueryString={explorerUrlQueryString}
                    />
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
                            symbol={network.symbol}
                        />
                    </Item>
                )}

                {/* Ethereum */}
                {tx.ethereumSpecific && (
                    <>
                        <Item label={<Translation id="TR_NONCE" />} iconName="receipt">
                            {tx.ethereumSpecific?.nonce}
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
                            {tx.ethereumSpecific.gasUsed && (
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
                            {isConfirmed ? (
                                <FeeRate
                                    feeRate={fromWei(tx.ethereumSpecific?.gasPrice || 0, 'gwei')}
                                    networkType="ethereum"
                                    symbol={network.symbol}
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
                                            'gwei',
                                        )}
                                        networkType="ethereum"
                                        symbol={network.symbol}
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
                                                'gwei',
                                            )}
                                            networkType="ethereum"
                                            symbol={network.symbol}
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
                                            'gwei',
                                        )}
                                        networkType="ethereum"
                                        symbol={network.symbol}
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
            </Grid>
        </Card>
    );
};
