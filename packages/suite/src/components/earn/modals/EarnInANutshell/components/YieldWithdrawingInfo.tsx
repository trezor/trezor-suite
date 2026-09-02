import { Translation } from '@suite/intl';
import { StepList } from '@trezor/components';

import { EarnInfoRow } from './EarnInfoRow';

interface YieldWithdrawingInfoProps {
    depositSymbol: string;
    isWrappedNativeVault?: boolean;
    nativeSymbol?: string;
}

export const YieldWithdrawingInfo = ({
    depositSymbol,
    isWrappedNativeVault = false,
    nativeSymbol,
}: YieldWithdrawingInfoProps) => {
    // The user's account receives the native coin (e.g. ETH); `depositSymbol` is the wrapped
    // token the vault redeems into (e.g. WETH), which the unwrap step then converts back.
    const receiveSymbol = isWrappedNativeVault && nativeSymbol ? nativeSymbol : depositSymbol;

    return (
        <StepList bulletGap={12} gap={16} bulletSize="small" titleGap={2}>
            <EarnInfoRow
                heading={<Translation id="TR_EARN_SIGN_WITHDRAWAL_TRANSACTION" />}
                subheading={
                    <Translation
                        id="TR_EARN_YIELD_WITHDRAW_USES_VAULT_TOKENS_SUB"
                        values={{ supplySymbol: depositSymbol }}
                    />
                }
                content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
            />
            {isWrappedNativeVault && nativeSymbol && (
                <EarnInfoRow
                    heading={
                        <Translation
                            id="TR_EARN_YIELD_UNWRAP_TITLE"
                            values={{ tokenSymbol: depositSymbol, nativeSymbol }}
                        />
                    }
                    content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
                />
            )}
            <EarnInfoRow
                heading={
                    <Translation
                        id="TR_EARN_YIELD_RECEIVE_IN_ACCOUNT"
                        values={{ supplySymbol: receiveSymbol }}
                    />
                }
                content={{ text: <Translation id="TR_EARN_INSTANTLY" /> }}
            />
        </StepList>
    );
};
