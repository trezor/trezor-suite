import styled, { useTheme } from 'styled-components';
import { fromWei } from 'web3-utils';

import {
    IconCircle,
    Text,
    H3,
    useElevation,
    Card,
    InfoItem,
    InfoSegments,
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

const Item = ({ label, iconName, children }: Partial<InfoItemProps>) => (
    <InfoItem
        label={label}
        iconName={iconName}
        labelWidth={100}
        typographyStyle="label"
        direction="row"
    >
        <Text as="div" typographyStyle="label" ellipsisLineCount={1}>
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
};

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

            <Grid columns={2} gap={spacings.sm}>
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
                <Item label={<Translation id="TR_TXID" />} iconName="biometric">
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
                        {`${tx?.feeRate ? tx.feeRate : getFeeRate(tx)} ${getFeeUnits('bitcoin')}`}
                    </Item>
                )}

                {/* Ethereum */}
                {tx.ethereumSpecific && (
                    <>
                        <Item label={<Translation id="TR_GAS_LIMIT" />} iconName="receipt">
                            {tx.ethereumSpecific.gasLimit}
                        </Item>

                        <Item label={<Translation id="TR_GAS_USED" />} iconName="receipt">
                            {tx.ethereumSpecific.gasUsed ? (
                                tx.ethereumSpecific.gasUsed
                            ) : (
                                <Translation id="TR_BUY_STATUS_PENDING" />
                            )}
                        </Item>

                        <Item label={<Translation id="TR_GAS_PRICE" />} iconName="receipt">
                            {`${fromWei(tx.ethereumSpecific?.gasPrice ?? '0', 'gwei')} ${getFeeUnits(
                                'ethereum',
                            )}`}
                        </Item>

                        <Item label={<Translation id="TR_NONCE" />} iconName="receipt">
                            {tx.ethereumSpecific?.nonce}
                        </Item>
                    </>
                )}
            </Grid>
        </Card>
    );
};
