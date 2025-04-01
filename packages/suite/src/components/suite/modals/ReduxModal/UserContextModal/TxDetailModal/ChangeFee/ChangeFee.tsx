import { ReactNode } from 'react';

import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
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

const ChangeFeeLoaded = (props: ChangeFeeProps) => {
    const { tx, showChained, children } = props;
    const {
        account: { networkType },
        chainedTxs,
    } = useRbfContext();

    const feeRate =
        tx.rbfParams?.type === 'bitcoin' && tx.rbfParams?.feeRate !== undefined ? (
            <FeeRate feeRate={tx.rbfParams.feeRate} networkType={networkType} symbol={tx.symbol} />
        ) : null;

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
                            <Translation id="TR_CURRENT_FEE" />
                            {feeRate && <> ({feeRate})</>}
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
