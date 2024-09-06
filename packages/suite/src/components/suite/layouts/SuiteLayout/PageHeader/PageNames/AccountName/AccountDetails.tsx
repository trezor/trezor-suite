import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Account } from '@suite-common/wallet-types';
import { spacingsPx } from '@trezor/theme';
import { CoinLogo, H2 } from '@trezor/components';
import { typography } from '@trezor/theme';
import {
    MetadataLabeling,
    AccountLabel,
    FormattedCryptoAmount,
    FiatValue,
    AmountUnitSwitchWrapper,
} from 'src/components/suite';
import { useAccountLabel } from 'src/components/suite/AccountLabel';
import { useSelector } from 'src/hooks/suite';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';

const rotateIn = keyframes`
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: 0;
        opacity: 1;
    }
`;

const rotateOut = keyframes`
    from {
        transform: translateY(-100%);
        opacity: 0;
    }
    to {
        transform: 0;
        opacity: 1;
    }
`;

const getAnimation = ($isBalanceShown: boolean, $shouldAnimate: boolean) => {
    if (!$shouldAnimate) return 'none';

    return $isBalanceShown ? rotateIn : rotateOut;
};

const DetailsContainer = styled.div<{ $isBalanceShown: boolean; $shouldAnimate: boolean }>`
    display: flex;
    flex-direction: column;
    justify-content: ${({ $isBalanceShown }) => ($isBalanceShown ? 'space-between' : 'center')};
    animation: ${({ $isBalanceShown, $shouldAnimate }) =>
            getAnimation($isBalanceShown, $shouldAnimate)}
        0.3s forwards;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const AccountHeading = styled(H2)<{ $isBalanceShown: boolean }>`
    display: flex;
    align-items: center;

    ${({ $isBalanceShown }) => typography[$isBalanceShown ? 'body' : 'titleMedium']};
`;

const AccountBalance = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.textSubdued};
`;

const CryptoBalance = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
`;

interface AccountDetailsProps {
    selectedAccount: Account;
    isBalanceShown: boolean;
}

export const AccountDetails = ({ selectedAccount, isBalanceShown }: AccountDetailsProps) => {
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const selectedAccountLabels = useSelector(selectLabelingDataForSelectedAccount);
    const { defaultAccountLabelString } = useAccountLabel();
    const { symbol, key, path, index, accountType, formattedBalance } = selectedAccount;

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (!hasMounted) return;

        setShouldAnimate(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBalanceShown]);

    return (
        <DetailsContainer $isBalanceShown={isBalanceShown} $shouldAnimate={shouldAnimate}>
            <AccountHeading $isBalanceShown={isBalanceShown}>
                <MetadataLabeling
                    accountType={accountType}
                    networkType={selectedAccount.networkType}
                    path={path}
                    defaultVisibleValue={
                        <AccountLabel
                            showAccountTypeBadge
                            accountLabel={selectedAccountLabels.accountLabel}
                            accountType={accountType}
                            symbol={selectedAccount.symbol}
                            index={index}
                            path={path}
                            networkType={selectedAccount.networkType}
                        />
                    }
                    payload={{
                        type: 'accountLabel',
                        entityKey: key,
                        defaultValue: path,
                        value: selectedAccountLabels.accountLabel,
                    }}
                    defaultEditableValue={defaultAccountLabelString({ accountType, symbol, index })}
                    updateFlag={isBalanceShown}
                />
            </AccountHeading>
            {isBalanceShown && (
                <AccountBalance>
                    <CryptoBalance>
                        <CoinLogo size={16} symbol={symbol} />
                        <AmountUnitSwitchWrapper symbol={symbol}>
                            <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                        </AmountUnitSwitchWrapper>
                    </CryptoBalance>
                    <span>
                        ≈ <FiatValue amount={formattedBalance} symbol={symbol} />
                    </span>
                </AccountBalance>
            )}
        </DetailsContainer>
    );
};
