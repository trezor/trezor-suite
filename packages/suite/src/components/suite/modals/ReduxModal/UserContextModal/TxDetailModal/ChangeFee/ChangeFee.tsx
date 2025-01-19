import { ReactNode } from 'react';

import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount, getFeeUnits } from '@suite-common/wallet-utils';
import { Card, Divider, InfoItem, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { UseRbfProps, useRbfContext } from 'src/hooks/wallet/useRbfForm';

import { AffectedTransactions } from './AffectedTransactions';
import { DecreasedOutputs } from './DecreasedOutputs';
import { RbfFees } from './RbfFees';

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
    } = useRbfContext();

    const feeRate =
        networkType === 'bitcoin' ? `${tx.rbfParams?.feeRate} ${getFeeUnits(networkType)}` : null;
    const fee = formatNetworkAmount(tx.fee, tx.symbol);

    return (
        <Card fillType="flat">
            <InfoItem
                direction="row"
                label={
                    <>
                        <Translation id="TR_CURRENT_FEE" />
                        {feeRate && ` (${feeRate})`}
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

            <DecreasedOutputs />
            <AffectedTransactions showChained={showChained} />

            {children}
        </Card>
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
