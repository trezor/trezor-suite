import { ReactNode } from 'react';

import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Card, Column, Divider, InfoItem, Row, Text } from '@trezor/components';
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
        networkType === 'bitcoin' && tx.rbfParams?.feeRate !== undefined ? (
            <FeeRate feeRate={tx.rbfParams.feeRate} networkType={networkType} />
        ) : null;

    const fee = formatNetworkAmount(tx.fee, tx.symbol);

    return (
        <>
            <Card fillType="flat" paddingType="none">
                <Text typographyStyle="body" margin={spacings.md}>
                    <Translation id="TR_BUMP_FEE_SUBTEXT" />
                </Text>
                <Divider margin={spacings.zero} />
                <Column margin={spacings.md}>
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
                </Column>
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
