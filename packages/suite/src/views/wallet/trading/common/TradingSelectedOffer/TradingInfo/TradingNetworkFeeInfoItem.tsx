import { useState } from 'react';
import { useSelector } from 'react-redux';

import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type FeeInfo, type FormState } from '@suite-common/wallet-types';
import { InfoItem, Skeleton, Text, TextButton, Tooltip } from '@trezor/components';
import { PencilSimpleIcon } from '@trezor/icons';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { type getFeeTooltipTextId } from '#src/components/wallet/Fees/feeUtils';
import { TradingExchangeNetworkFeeModal } from '#src/views/wallet/trading/exchange/TradingExchangeNetworkFeeModal/TradingExchangeNetworkFeeModal';

export type TradingNetworkFeeInfoItemProps = {
    isLoading?: boolean;
    amount: string;
    symbol: NetworkSymbol;
    tooltipTextId: ReturnType<typeof getFeeTooltipTextId>;
    edit?: {
        account: Account;
        feeInfo: FeeInfo;
        composeFormState: FormState;
        assumeNewAccount?: boolean;
        onConfirm: (composedTransactionInfo: TradingComposedTransactionInfo) => void;
    };
};

export const TradingNetworkFeeInfoItem = ({
    isLoading = false,
    amount,
    symbol,
    tooltipTextId,
    edit,
}: TradingNetworkFeeInfoItemProps) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const shouldAnimateSkeleton = useSelector(selectShouldAnimateLoadingSkeleton);

    if (isEditModalOpen && !edit) {
        setIsEditModalOpen(false);
    }

    return (
        <>
            <InfoItem
                label={
                    <Tooltip
                        content={
                            <Translation
                                id={tooltipTextId}
                                values={{
                                    br: <br />,
                                    networkDisplaySymbol: <AssetSymbol networkSymbol={symbol} />,
                                }}
                            />
                        }
                        hasIcon
                    >
                        <Translation id="TR_TRADING_NETWORK_FEE" />
                    </Tooltip>
                }
                direction="row"
            >
                {isLoading && <Skeleton width={60} height={16} animate={shouldAnimateSkeleton} />}
                {!isLoading && edit && (
                    <TextButton
                        onClick={() => setIsEditModalOpen(true)}
                        size="small"
                        iconRight={PencilSimpleIcon}
                        intent="brand"
                        isUnderlined
                        data-testid="@trading/offer/info/network-fee"
                    >
                        <BaseCurrencyValue
                            disableHiddenPlaceholder
                            amount={amount}
                            symbol={symbol}
                            rateType="current"
                            showApproximationIndicator
                        />
                    </TextButton>
                )}
                {!isLoading && !edit && (
                    <Tooltip
                        content={
                            <FormattedCryptoAmount
                                disableHiddenPlaceholder
                                value={amount}
                                networkSymbol={symbol}
                            />
                        }
                    >
                        <Text
                            typographyStyle="body-sm"
                            data-testid="@trading/offer/info/network-fee"
                        >
                            <BaseCurrencyValue
                                disableHiddenPlaceholder
                                amount={amount}
                                symbol={symbol}
                                rateType="current"
                                showApproximationIndicator
                            />
                        </Text>
                    </Tooltip>
                )}
            </InfoItem>

            {isEditModalOpen && edit && (
                <TradingExchangeNetworkFeeModal
                    account={edit.account}
                    feeInfo={edit.feeInfo}
                    composeFormState={edit.composeFormState}
                    assumeNewAccount={edit.assumeNewAccount}
                    onConfirm={edit.onConfirm}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </>
    );
};
