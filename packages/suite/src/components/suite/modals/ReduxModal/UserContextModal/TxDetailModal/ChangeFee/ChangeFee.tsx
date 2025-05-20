import { ReactNode } from 'react';

import { NetworkType, getNetwork } from '@suite-common/wallet-config';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount, isEip1559 } from '@suite-common/wallet-utils';
import { Card, Divider, InfoItem, Row, Text } from '@trezor/components';
import { FeeRate } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { UseRbfProps, useRbfContext } from 'src/hooks/wallet/useRbfForm';

import { RbfFees } from './RbfFees';
import { AffectedTransactions } from '../AffectedTransactions/AffectedTransactions';
import { DecreasedOutputs } from '../AffectedTransactions/DecreasedOutputs';

/* children are only for test purposes, this prop is not available in regular build */
interface ChangeFeeProps extends UseRbfProps {
    tx: WalletAccountTransaction;
    children?: ReactNode;
    showChained: () => void;
}

const getFeeRate = (tx: WalletAccountTransaction, networkType: NetworkType) => {
    const rbf = tx.rbfParams;

    if (!rbf) return null;

    if (rbf.type === 'bitcoin' && rbf.feeRate !== undefined) {
        return <FeeRate feeRate={rbf.feeRate} networkType={networkType} symbol={tx.symbol} />;
    }

    if (rbf.type === 'ethereum') {
        const { gasPrice, maxFeePerGas } = rbf;

        return isEip1559(rbf) ? (
            <FeeRate feeRate={maxFeePerGas} networkType={networkType} symbol={tx.symbol} />
        ) : (
            <FeeRate feeRate={gasPrice} networkType={networkType} symbol={tx.symbol} />
        );
    }

    return null;
};

const ChangeFeeLoaded = (props: ChangeFeeProps) => {
    const { tx, showChained, children } = props;
    const {
        account: { networkType },
        chainedTxs,
    } = useRbfContext();

    const fee = formatNetworkAmount(tx.fee, tx.symbol);

    return (
        <>
            <Card
                fillType="flat"
                paddingType="small"
                heading={<Translation id="TR_BUMP_FEE_SUBTEXT" />}
            >
                <InfoItem
                    direction="row"
                    label={
                        <>
                            <Translation
                                id={
                                    getNetwork(tx.symbol).networkType === 'ethereum'
                                        ? 'TR_CURRENT_MAXIMUM_FEE_SPEED_UP'
                                        : 'TR_CURRENT_FEE_SPEED_UP'
                                }
                                values={{
                                    feeRate: getFeeRate(tx, networkType),
                                }}
                            />
                        </>
                    }
                    typographyStyle="body"
                >
                    <Row gap={spacings.md} alignItems="baseline">
                        <FormattedCryptoAmount
                            disableHiddenPlaceholder
                            value={fee}
                            symbol={tx.symbol}
                        />
                        <Text variant="tertiary" typographyStyle="label">
                            <FiatValue
                                disableHiddenPlaceholder
                                amount={fee}
                                symbol={tx.symbol}
                                showApproximationIndicator
                            />
                        </Text>
                    </Row>
                </InfoItem>

                <Divider />

                <RbfFees />

                {children}
            </Card>

            <DecreasedOutputs />

            <AffectedTransactions chainedTxs={chainedTxs} showChained={showChained} />
        </>
    );
};

export const ChangeFee = (props: Omit<ChangeFeeProps, 'selectedAccount' | 'rbfParams'>) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    if (selectedAccount.status !== 'loaded' || !props.tx.rbfParams) {
        return null;
    }

    return (
        <ChangeFeeLoaded
            selectedAccount={selectedAccount}
            rbfParams={props.tx.rbfParams}
            {...props}
        />
    );
};
