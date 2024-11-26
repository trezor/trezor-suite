import { ReactNode } from 'react';

import { Divider, Card, InfoItem, Row, Text } from '@trezor/components';
import { formatNetworkAmount, getFeeUnits } from '@suite-common/wallet-utils';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { spacings } from '@trezor/theme';

import { Translation, FiatValue, FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useRbf, RbfContext, UseRbfProps } from 'src/hooks/wallet/useRbfForm';

import { RbfFees } from './RbfFees';
import { AffectedTransactions } from './AffectedTransactions';
import { DecreasedOutputs } from './DecreasedOutputs';

/* children are only for test purposes, this prop is not available in regular build */
interface ChangeFeeProps extends UseRbfProps {
    tx: WalletAccountTransaction;
    children?: ReactNode;
    showChained: () => void;
}

const ChangeFeeLoaded = (props: ChangeFeeProps) => {
    const contextValues = useRbf(props);
    const { tx, showChained, children } = props;
    const { networkType } = contextValues.account;
    const feeRate =
        networkType === 'bitcoin' ? `${tx.rbfParams?.feeRate} ${getFeeUnits(networkType)}` : null;
    const fee = formatNetworkAmount(tx.fee, tx.symbol);

    return (
        <RbfContext.Provider value={contextValues}>
            <Card fillType="none">
                <InfoItem
                    direction="row"
                    label={
                        <>
                            <Translation id="TR_CURRENT_FEE" />
                            &nbsp;({feeRate})
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
        </RbfContext.Provider>
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
