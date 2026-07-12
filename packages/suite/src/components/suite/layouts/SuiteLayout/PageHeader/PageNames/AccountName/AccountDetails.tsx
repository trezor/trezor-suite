import { useEffect, useMemo, useRef } from 'react';

import { motion, useAnimation } from 'framer-motion';
import styled from 'styled-components';

import { AccountTypeBadge, useAccountLabel } from '@suite/account';
import { useTranslation } from '@suite/intl';
import { Labeling } from '@suite/labeling';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Column, H2, Row, Text, motionEasing } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { AmountUnitSwitchWrapper } from 'src/components/suite/AmountUnitSwitchWrapper';
import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
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
    const { defaultLabel, label } = useAccountLabel({ account: selectedAccount });

    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();
    const { translationString } = useTranslation();

    const { symbol, key, path, accountType, formattedBalance, deviceState, networkType } =
        selectedAccount;
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

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
                <TokenIcon size={40} symbol={symbol} />
                <Column
                    overflow="hidden"
                    // To accommodate the labeling component
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
                                        data-testid="@wallet/account/crypto-balance"
                                        value={formattedBalance}
                                        symbol={symbol}
                                    />
                                </AmountUnitSwitchWrapper>
                                {shallDisplayBaseCurrency && (
                                    <span data-testid="@wallet/account/fiat-amount">
                                        <BaseCurrencyValue
                                            amount={formattedBalance}
                                            symbol={symbol}
                                            showApproximationIndicator
                                        />
                                    </span>
                                )}
                            </Row>
                        </Text>
                    )}
                </Column>
            </Row>
        </DetailsContainer>
    );
};
