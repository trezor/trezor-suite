import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AssetSymbol } from '@suite-native/assets';
import { BannerInline, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type YieldWithdrawWarningProps = {
    isAmountTooHigh: boolean;
    isMaxWithdrawInfoVisible: boolean;
    shouldShowNetworkFeeWarning: boolean;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const YieldWithdrawWarning = ({
    isAmountTooHigh,
    isMaxWithdrawInfoVisible,
    shouldShowNetworkFeeWarning,
    networkSymbol,
    tokenContract,
}: YieldWithdrawWarningProps) => {
    const vaultTokenSymbol = (
        <AssetSymbol
            networkSymbol={networkSymbol}
            contractAddress={tokenContract}
            variant="body-sm"
            color="contentInfo"
        />
    );

    if (isAmountTooHigh) {
        return (
            <BannerInline
                intent="warning"
                title={<Translation id="earn.yieldWithdrawFlowScreen.amountExceedsDeposited" />}
            />
        );
    }

    if (!shouldShowNetworkFeeWarning && !isMaxWithdrawInfoVisible) {
        return null;
    }

    return (
        <VStack spacing="sp16">
            {shouldShowNetworkFeeWarning && (
                <BannerInline
                    intent="warning"
                    title={<Translation id="earn.yieldWithdrawFlowScreen.networkFeeWarning" />}
                />
            )}
            {isMaxWithdrawInfoVisible && (
                <BannerInline
                    intent="info"
                    title={
                        <Translation
                            id="earn.yieldWithdrawFlowScreen.maxWithdrawInfo"
                            values={{ vaultTokenSymbol }}
                        />
                    }
                />
            )}
        </VStack>
    );
};
