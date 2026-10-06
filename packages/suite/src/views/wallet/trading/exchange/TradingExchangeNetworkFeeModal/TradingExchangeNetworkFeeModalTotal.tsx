import { Card, Row } from '@trezor/components';

import { CollapsibleFeesHeader } from 'src/components/wallet/Fees/CollapsibleFees/CollapsibleFeesHeader';
import { MaximumFee } from 'src/components/wallet/Fees/CollapsibleFees/MaximumFee';
import { TronFee } from 'src/components/wallet/Fees/CollapsibleFees/TronFee/TronFee';
import { type useTransactionMaxFee } from 'src/components/wallet/Fees/CollapsibleFees/hooks/useTransactionMaxFee';
import { useFeesContext } from 'src/components/wallet/Fees/context/FeesContext';

export type TradingExchangeNetworkFeeModalTotalProps = {
    txMaxFee: ReturnType<typeof useTransactionMaxFee>;
};

export const TradingExchangeNetworkFeeModalTotal = ({
    txMaxFee,
}: TradingExchangeNetworkFeeModalTotalProps) => {
    const { networkType } = useFeesContext();

    return (
        <Card type="contrast" paddingType="small">
            <Row justifyContent="space-between" gap={12}>
                <CollapsibleFeesHeader
                    label="TR_TOTAL"
                    typographyStyle="body-md"
                    supportsAdjustableFees
                />
                {networkType === 'tron' ? (
                    <TronFee typographyStyle="body-md" />
                ) : (
                    <MaximumFee typographyStyle="body-md" txMaxFee={txMaxFee} />
                )}
            </Row>
        </Card>
    );
};
