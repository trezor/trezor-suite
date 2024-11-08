import styled, { useTheme } from 'styled-components';
import { fromWei } from 'web3-utils';

import {
    IconCircle,
    Text,
    H3,
    useElevation,
    Card,
    InfoItem,
    InfoPair,
    Row,
    InfoItemProps,
    Grid,
    Divider,
} from '@trezor/components';
import { Network } from '@suite-common/wallet-config';
import { getTxIcon, isPending, getFeeUnits, getFeeRate } from '@suite-common/wallet-utils';
import { Elevation, borders, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';
import { CoinLogo } from '@trezor/product-components';

import { Translation, FormattedDateWithBullet } from 'src/components/suite';
import { WalletAccountTransaction } from 'src/types/wallet';
import { TransactionHeader } from 'src/components/wallet/TransactionItem/TransactionHeader';
import { IOAddress } from 'src/components/suite/copy/IOAddress';

const IconWrapper = styled.div<{ $elevation: Elevation }>`
    display: flex;
    position: relative;
    border: ${spacingsPx.xxs} solid ${mapElevationToBorder};
    border-radius: ${borders.radii.full};
`;

const NestedIconWrapper = styled.div`
    position: absolute;
    top: -${spacingsPx.xxs};
    right: -${spacingsPx.xxs};
`;

interface BasicTxDetailsProps {
    tx: WalletAccountTransaction;
    network: Network;
    confirmations: number;
    explorerUrl: string;
    explorerUrlQueryString?: string;
}

export const BasicTxDetails = ({
    tx,
    confirmations,
    network,
    explorerUrl,
    explorerUrlQueryString,
}: BasicTxDetailsProps) => {
    const { elevation } = useElevation();
    const theme = useTheme();
    // all solana txs which are fetched are already confirmed
    const isConfirmed = confirmations > 0 || tx.solanaSpecific?.status === 'confirmed';

    const InfoItemProps = {
        typographyStyle: 'label',
        labelTypographyStyle: 'label',
        labelWidth: 100,
        direction: 'row',
    } as Partial<InfoItemProps>;

    return (
        <Card>
            <Row gap={spacings.sm}>
                <IconWrapper $elevation={elevation}>
                    <CoinLogo symbol={tx.symbol} size={48} />
                    <NestedIconWrapper>
                        <IconCircle
                            size={12}
                            paddingType="small"
                            hasBorder={false}
                            iconColor={{
                                foreground:
                                    theme[tx.type === 'failed' ? 'textAlertRed' : 'textDefault'],
                                background: mapElevationToBorder({ theme, $elevation: elevation }),
                            }}
                            name={getTxIcon(tx.type)}
                        />
                    </NestedIconWrapper>
                </IconWrapper>

                <H3 ellipsisLineCount={1}>
                    <TransactionHeader transaction={tx} isPending={isPending(tx)} />
                </H3>

                <Row gap={spacings.xxs} margin={{ left: 'auto' }}>
                    {isConfirmed ? (
                        <InfoPair
                            typographyStyle="hint"
                            variant="tertiary"
                            leftContent={
                                <Text typographyStyle="callout" variant="primary">
                                    <Translation id="TR_CONFIRMED_TX" />
                                </Text>
                            }
                            rightContent={
                                confirmations > 0 ? (
                                    <Translation
                                        id="TR_TX_CONFIRMATIONS"
                                        values={{ confirmationsCount: confirmations }}
                                    />
                                ) : undefined
                            }
                        />
                    ) : (
                        <Text typographyStyle="callout" variant="warning">
                            <Translation id="TR_UNCONFIRMED_TX" />
                        </Text>
                    )}
                </Row>
            </Row>

            <Divider />

            <Grid columns={2} gap={spacings.sm}>
                {/* MINED TIME */}
                <InfoItem
                    label={
                        isConfirmed ? (
                            <Translation id="TR_MINED_TIME" />
                        ) : (
                            <Translation id="TR_FIRST_SEEN" />
                        )
                    }
                    {...InfoItemProps}
                    iconName="calendar"
                >
                    {tx.blockTime ? (
                        <FormattedDateWithBullet value={new Date(tx.blockTime * 1000)} />
                    ) : (
                        <Translation id="TR_UNKNOWN_CONFIRMATION_TIME" />
                    )}
                </InfoItem>

                {/* TX ID */}
                <InfoItem
                    label={<Translation id="TR_TXID" />}
                    {...InfoItemProps}
                    iconName="biometric"
                >
                    <IOAddress
                        txAddress={tx.txid}
                        explorerUrl={explorerUrl}
                        explorerUrlQueryString={explorerUrlQueryString}
                    />
                </InfoItem>

                {/* Fee level */}
                {network.networkType === 'bitcoin' && (
                    <InfoItem
                        label={<Translation id="TR_FEE_RATE" />}
                        {...InfoItemProps}
                        iconName="receipt"
                    >
                        {/* tx.feeRate was added in @trezor/blockchain-link 2.1.5 meaning that users
                            might have locally saved old transactions without this field. since we
                            cant reliably migrate this data, we are keeping old way of displaying feeRate in place */}
                        {`${tx?.feeRate ? tx.feeRate : getFeeRate(tx)} ${getFeeUnits('bitcoin')}`}
                    </InfoItem>
                )}

                {/* Ethereum */}
                {tx.ethereumSpecific && (
                    <>
                        <InfoItem
                            label={<Translation id="TR_GAS_LIMIT" />}
                            {...InfoItemProps}
                            iconName="receipt"
                        >
                            {tx.ethereumSpecific.gasLimit}
                        </InfoItem>

                        <InfoItem
                            label={<Translation id="TR_GAS_USED" />}
                            {...InfoItemProps}
                            iconName="receipt"
                        >
                            {tx.ethereumSpecific.gasUsed ? (
                                tx.ethereumSpecific.gasUsed
                            ) : (
                                <Translation id="TR_BUY_STATUS_PENDING" />
                            )}
                        </InfoItem>

                        <InfoItem
                            label={<Translation id="TR_GAS_PRICE" />}
                            {...InfoItemProps}
                            iconName="receipt"
                        >
                            {`${fromWei(tx.ethereumSpecific?.gasPrice ?? '0', 'gwei')} ${getFeeUnits(
                                'ethereum',
                            )}`}
                        </InfoItem>

                        <InfoItem
                            label={<Translation id="TR_NONCE" />}
                            {...InfoItemProps}
                            iconName="receipt"
                        >
                            {tx.ethereumSpecific?.nonce}
                        </InfoItem>
                    </>
                )}
            </Grid>
        </Card>
    );
};
