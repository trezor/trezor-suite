import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { BannerInline, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useTokenMetadata } from '@suite-native/tokens';

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
    const token = useTokenMetadata(networkSymbol, tokenContract);
    const vaultTokenSymbol = tokenContract ? token?.symbol : getNetworkDisplaySymbol(networkSymbol);
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
