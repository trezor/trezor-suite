import { Translation } from '@suite/intl';
import { TokenIcon, TokenSymbol } from '@suite/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type AllowanceLimitType, type AllowanceTransactionType } from '@suite-common/wallet-types';
import { Icon, Row } from '@trezor/components';
import { ArrowRightIcon } from '@trezor/icons';

import { AllowanceAmount } from './AllowanceAmount';
import { AllowanceStepRow } from './AllowanceStepRow';
import { type AllowanceStepToken } from './AllowanceStepToken';

type AllowanceStepLimitRowsProps = {
    transactionType: AllowanceTransactionType;
    token: AllowanceStepToken;
    limitType: AllowanceLimitType;
    limitAmount: string;
    currentLimitAmount?: string;
    onEditLimit?: () => void;
};

export const AllowanceStepLimitRows = ({
    transactionType,
    token,
    limitType,
    limitAmount,
    currentLimitAmount,
    onEditLimit,
}: AllowanceStepLimitRowsProps) => {
    const tokenContract = toTokenAddress(token.contractAddress);
    const tokenIcon = (
        <TokenIcon symbol={token.networkSymbol} contractAddress={tokenContract} size={20} />
    );

    if (transactionType === 'revoke') {
        return (
            <AllowanceStepRow
                label="TR_APPROVAL_LIMIT"
                icon={tokenIcon}
                data-testid="@approval-step/limit"
            >
                <Row gap={8}>
                    <AllowanceAmount
                        amount={limitAmount}
                        decimals={token.decimals}
                        contractAddress={token.contractAddress}
                        networkSymbol={token.networkSymbol}
                        typographyStyle="body-sm"
                    />
                    <Icon as={ArrowRightIcon} size={16} />
                    0{' '}
                    <TokenSymbol networkSymbol={token.networkSymbol} tokenContract={tokenContract} />
                </Row>
            </AllowanceStepRow>
        );
    }

    const hasCurrentLimit = currentLimitAmount !== undefined;

    return (
        <>
            {hasCurrentLimit && (
                <AllowanceStepRow
                    label="TR_APPROVAL_CURRENT_LIMIT"
                    icon={tokenIcon}
                    data-testid="@approval-step/current-limit"
                >
                    <AllowanceAmount
                        amount={currentLimitAmount}
                        symbol={token.symbol}
                        decimals={token.decimals}
                        contractAddress={token.contractAddress}
                        networkSymbol={token.networkSymbol}
                        typographyStyle="body-sm"
                    />
                </AllowanceStepRow>
            )}
            <AllowanceStepRow
                label={hasCurrentLimit ? 'TR_APPROVAL_NEW_LIMIT' : 'TR_APPROVAL_LIMIT'}
                icon={tokenIcon}
                onEdit={onEditLimit}
                data-testid="@approval-step/limit"
            >
                {limitType === 'unlimited' ? (
                    <Translation id="TR_APPROVAL_VALUE_INFINITE" />
                ) : (
                    <AllowanceAmount
                        amount={limitAmount}
                        symbol={token.symbol}
                        decimals={token.decimals}
                        contractAddress={token.contractAddress}
                        networkSymbol={token.networkSymbol}
                        typographyStyle="body-sm"
                    />
                )}
            </AllowanceStepRow>
        </>
    );
};
