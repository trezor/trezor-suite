import { useEffect, useMemo, useRef } from 'react';

import { motion, useAnimation } from 'framer-motion';
import styled from 'styled-components';

import { selectSuiteSyncAccountLabel } from '@suite-common/suite-sync';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Column, H2, Row, Text, motionEasing } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { AmountUnitSwitchWrapper } from 'src/components/suite/AmountUnitSwitchWrapper';
import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { Labeling } from 'src/components/suite/labeling';
import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
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
    const selectedAccountLabels = useSelector(selectLabelingDataForSelectedAccount);
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
    const label = suiteSyncAccountLabel ?? selectedAccountLabels.accountLabel;
    const defaultLabel = getDefaultAccountLabel({
        accountType,
        symbol,
        index,
    });

    const getTypographyStyle = () => {
        if (isBalanceShown) {
            return 'highlight';
        } else if (isContentBelowBreakpoint) {
            return 'titleSmall';
        }

        return 'titleMedium';
    };

    const accountNameElement = useMemo(
        () => (
            <Labeling
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
                gap={isBalanceShown ? 8 : 12}
                placeholder={translationString('TR_LABELING_ACCOUNT_LABEL')}
            >
                {label || defaultLabel}
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
                    padding={{ right: 80, left: 8, vertical: 6 }}
                    gap={2}
                >
                    <H2 typographyStyle={getTypographyStyle()}>{accountNameElement}</H2>
                    {isBalanceShown && (
                        <Text variant="tertiary" typographyStyle="hint" as="div">
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
