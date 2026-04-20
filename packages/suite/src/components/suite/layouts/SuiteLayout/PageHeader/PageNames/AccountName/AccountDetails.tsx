import { useEffect, useMemo, useRef } from 'react';

import { motion, useAnimation } from 'framer-motion';
import styled from 'styled-components';

import { useTranslation } from '@suite/intl';
import { selectIsLegacyLabelingVisible, selectLabelingDataForAccount } from '@suite/metadata';
import { selectIsSuiteSyncEnabled, selectSuiteSyncAccountLabel } from '@suite-common/suite-sync';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Column, H2, Row, Text, motionEasing } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { AmountUnitSwitchWrapper } from 'src/components/suite/AmountUnitSwitchWrapper';
import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { Labeling } from 'src/components/suite/labeling';
import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

const DetailsContainer = styled(motion.div)`
    -webkit-app-region: no-drag;
    overflow: hidden;
`;

type AccountDetailsProps = {
    selectedAccount: Account;
    isBalanceShown: boolean;
};

export const AccountDetails = ({ selectedAccount, isBalanceShown }: AccountDetailsProps) => {
    const hasMountedRef = useRef(false);
    const controls = useAnimation();

    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);

    const selectedAccountLegacyLabels = useSelector(state =>
        selectLabelingDataForAccount(state, selectedAccount.key),
    );
    const { getDefaultAccountLabel } = useDefaultAccountLabel();

    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();
    const { translationString } = useTranslation();
    const { walletDescriptor } = parseDeviceStaticSessionId(selectedAccount.deviceState);

    const suiteSyncAccountLabel = useSelector(state =>
        selectSuiteSyncAccountLabel(
            state,
            walletDescriptor,
            selectedAccount.descriptor,
            selectedAccount.symbol,
        ),
    );

    const { symbol, key, path, index, accountType, formattedBalance, deviceState, networkType } =
        selectedAccount;
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

    const defaultLabel = getDefaultAccountLabel({ accountType, symbol, index });

    const label =
        (isSuiteSyncEnabled ? suiteSyncAccountLabel : null) ||
        (isLegacyLabelingVisible ? selectedAccountLegacyLabels.accountLabel : null) ||
        defaultLabel;

    const getTypographyStyle = () => {
        if (isBalanceShown) {
            return 'body-md-strong';
        } else if (isContentBelowBreakpoint) {
            return 'headline-sm';
        }

        return 'headline-md';
    };

    const accountNameElement = useMemo(
        () => (
            <Labeling
                key={`account-label-${key}`}
                payload={{
                    type: 'accountLabel',
                    entityKey: key,
                    defaultValue: path,
                    value: label,
                }}
                deviceStaticSessionId={deviceState}
                defaultValue={defaultLabel}
                rightAddon={
                    <AccountTypeBadge
                        accountType={accountType}
                        path={path}
                        networkType={networkType}
                        size={isBalanceShown ? 'small' : 'medium'}
                    />
                }
                gap={8}
                placeholder={translationString('TR_LABELING_ACCOUNT_LABEL')}
            >
                {label}
            </Labeling>
        ),
        [
            key,
            path,
            label,
            deviceState,
            defaultLabel,
            accountType,
            networkType,
            isBalanceShown,
            translationString,
        ],
    );

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;

            return;
        }

        controls.start({
            y: isBalanceShown ? ['100%', '0%'] : ['-100%', '0%'],
            opacity: [0, 1],
            transition: { duration: 0.3, ease: motionEasing.enter },
        });
    }, [controls, isBalanceShown]);

    return (
        <DetailsContainer initial={false} animate={controls}>
            <Row gap={4} overflow="hidden">
                <CoinLogo size={36} symbol={symbol} type="token" />
                <Column
                    overflow="hidden"
                    // To accomodate the labeling component
                    padding={8}
                >
                    <H2 typographyStyle={getTypographyStyle()}>{accountNameElement}</H2>
                    {isBalanceShown && (
                        <Text
                            intent="neutral"
                            priority="secondary"
                            typographyStyle="body-xs"
                            as="div"
                        >
                            <Row gap={4}>
                                <AmountUnitSwitchWrapper symbol={symbol}>
                                    <FormattedCryptoAmount
                                        value={formattedBalance}
                                        symbol={symbol}
                                    />
                                </AmountUnitSwitchWrapper>
                                {shallDisplayBaseCurrency && (
                                    <BaseCurrencyValue
                                        amount={formattedBalance}
                                        symbol={symbol}
                                        showApproximationIndicator
                                    />
                                )}
                            </Row>
                        </Text>
                    )}
                </Column>
            </Row>
        </DetailsContainer>
    );
};
