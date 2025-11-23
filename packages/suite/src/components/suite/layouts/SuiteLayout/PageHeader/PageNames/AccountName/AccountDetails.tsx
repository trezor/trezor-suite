import { useEffect, useState } from 'react';

import styled, { keyframes } from 'styled-components';

import { selectAccountLabel } from '@suite-common/suite-sync';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Paragraph, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacingsPx, zIndices } from '@trezor/theme';

import {
    AccountLabel,
    AmountUnitSwitchWrapper,
    BaseCurrencyValue,
    FormattedCryptoAmount,
    MetadataLabeling,
} from 'src/components/suite';
import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';

import { Column } from '../../../../../../../views/wallet/staking/components/CardanoPrimitives';
import { BasicName, NoDragContainer } from '../BasicName';

const LOGO_SIZE = 36;

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
    gap: ${spacingsPx.sm};
    align-items: center;
    animation: ${({ $isBalanceShown, $shouldAnimate }) =>
            getAnimation($isBalanceShown, $shouldAnimate)}
        0.3s forwards;
    -webkit-app-region: no-drag;
`;

// so that "to sats" button does not hide symbol and fiat
const ForegroundWrapper = styled.div`
    z-index: ${zIndices.base + 1};
    display: flex;
`;

interface AccountDetailsProps {
    selectedAccount: Account;
    isBalanceShown: boolean;
}

export const AccountDetails = ({ selectedAccount, isBalanceShown }: AccountDetailsProps) => {
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const selectedAccountLabels = useSelector(selectLabelingDataForSelectedAccount);

    const { walletDescriptor } = parseDeviceStaticSessionId(selectedAccount.deviceState);

    const suiteSyncAccountLabel = useSelector(state =>
        selectAccountLabel({
            state,
            walletDescriptor,
            accountKey: selectedAccount.key,
        }),
    );

    const label = suiteSyncAccountLabel ?? selectedAccountLabels.accountLabel;

    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const { symbol, key, path, index, accountType, formattedBalance, deviceState } =
        selectedAccount;
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (!hasMounted) return;

        setShouldAnimate(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBalanceShown]);

    const AccountName = () => (
        <MetadataLabeling
            variant="text"
            accountType={accountType}
            networkType={selectedAccount.networkType}
            path={path}
            defaultVisibleValue={
                <AccountLabel
                    account={{
                        ...selectedAccount,
                        accountLabel: label,
                    }}
                    showAccountTypeBadge
                />
            }
            payload={{
                type: 'accountLabel',
                entityKey: key,
                defaultValue: path,
                value: label,
            }}
            deviceStaticSessionId={deviceState}
            defaultEditableValue={getDefaultAccountLabel({
                accountType,
                symbol,
                index,
            })}
            updateFlag={isBalanceShown}
        />
    );

    return (
        <DetailsContainer $isBalanceShown={isBalanceShown} $shouldAnimate={shouldAnimate}>
            <CoinLogo size={LOGO_SIZE} symbol={symbol} type="token" />
            <div>
                {isBalanceShown ? (
                    <NoDragContainer>
                        <Column>
                            <Paragraph typographyStyle="highlight" textWrap="nowrap">
                                <AccountName />
                            </Paragraph>

                            <Row gap={4}>
                                <AmountUnitSwitchWrapper symbol={symbol}>
                                    <Text variant="tertiary">
                                        <FormattedCryptoAmount
                                            value={formattedBalance}
                                            symbol={symbol}
                                        />
                                    </Text>
                                </AmountUnitSwitchWrapper>
                                {shallDisplayBaseCurrency && (
                                    <ForegroundWrapper>
                                        <AmountUnitSwitchWrapper symbol={symbol}>
                                            <Text variant="tertiary">
                                                <BaseCurrencyValue
                                                    amount={formattedBalance}
                                                    symbol={symbol}
                                                    showApproximationIndicator
                                                />
                                            </Text>
                                        </AmountUnitSwitchWrapper>
                                    </ForegroundWrapper>
                                )}
                            </Row>
                        </Column>
                    </NoDragContainer>
                ) : (
                    <BasicName>
                        <AccountName />
                    </BasicName>
                )}
            </div>
        </DetailsContainer>
    );
};
