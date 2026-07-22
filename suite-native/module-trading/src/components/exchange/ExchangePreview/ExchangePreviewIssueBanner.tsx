import { type ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type ExchangeIssue } from '@suite-common/trading';
import { AnimatedFullAlertBox, BulletListItem, VStack } from '@suite-native/atoms';
import { Translation, selectLocale } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';

import { useExchangeIssue } from '../../../hooks/exchange/useExchangeIssue';
import { useExchangeSignTransaction } from '../../../hooks/exchange/useExchangeSignTransaction';

const CONTINUE_ANYWAY_BUTTON_TEST_ID = '@trading/exchange-preview/continue-anyway-button';

type ExchangeIssueContent = {
    type: ExchangeIssue['type'];
    title: ReactNode;
    description?: ReactNode;
    bullets?: ReactNode[];
};

const getIssueContent = (
    issue: ExchangeIssue,
    percentFormatter: Intl.NumberFormat,
): ExchangeIssueContent => {
    switch (issue.type) {
        case 'high-risk-with-price-impact': {
            const percent = percentFormatter.format(issue.deviation);

            return {
                type: issue.type,
                title: (
                    <Translation id="moduleTrading.transactionSimulation.issues.highRisk.title" />
                ),
                bullets: [
                    <Translation
                        key="bullet-1"
                        id="moduleTrading.transactionSimulation.issues.highRisk.description"
                    />,
                    <Translation
                        key="bullet-2"
                        id="moduleTrading.transactionSimulation.issues.priceImpact.title"
                        values={{ percent }}
                    />,
                ],
            };
        }
        case 'high-risk': {
            return {
                type: issue.type,
                title: (
                    <Translation id="moduleTrading.transactionSimulation.issues.highRisk.title" />
                ),
                description: (
                    <Translation id="moduleTrading.transactionSimulation.issues.highRisk.description" />
                ),
            };
        }
        case 'price-impact': {
            const percent = percentFormatter.format(issue.deviation);

            return {
                type: issue.type,
                title: (
                    <Translation
                        id="moduleTrading.transactionSimulation.issues.priceImpact.title"
                        values={{ percent }}
                    />
                ),
                description: (
                    <Translation id="moduleTrading.transactionSimulation.issues.priceImpact.description" />
                ),
            };
        }
        case 'slippage-too-low': {
            return {
                type: issue.type,
                title: (
                    <Translation id="moduleTrading.transactionSimulation.issues.slippageTooLow.title" />
                ),
                description: (
                    <Translation id="moduleTrading.transactionSimulation.issues.slippageTooLow.description" />
                ),
            };
        }
        default:
            return exhaustive(issue);
    }
};

type ExchangePreviewIssueBannerProps = {
    onSignTransactionNavigation: () => void;
};

export const ExchangePreviewIssueBanner = ({
    onSignTransactionNavigation,
}: ExchangePreviewIssueBannerProps) => {
    const locale = useSelector(selectLocale);

    const { isSimulationEnabled, issue } = useExchangeIssue();
    const { handleSignTransaction, isSigningPreparationLoading } = useExchangeSignTransaction({
        onSignTransactionNavigation,
    });

    const percentFormatter = useMemo(
        () =>
            new Intl.NumberFormat(locale, {
                style: 'percent',
                maximumFractionDigits: 0,
            }),
        [locale],
    );

    if (!issue) {
        return null;
    }

    const { title, description, bullets } = getIssueContent(issue, percentFormatter);

    if (!isSimulationEnabled) {
        return (
            <AnimatedFullAlertBox intent={issue.severity} title={title} description={description} />
        );
    }

    return (
        <AnimatedFullAlertBox
            intent={issue.severity}
            title={title}
            description={description}
            primaryButtonLabel={
                <Translation id="moduleTrading.transactionSimulation.continueAnyway" />
            }
            onPressPrimaryButton={handleSignTransaction}
            primaryButtonProps={{
                isLoading: isSigningPreparationLoading,
                testID: CONTINUE_ANYWAY_BUTTON_TEST_ID,
            }}
        >
            {bullets && bullets?.length > 0 && (
                <VStack spacing="sp2">
                    {bullets.map((bullet, index) => (
                        <BulletListItem
                            variant="body-sm"
                            key={index}
                            color={
                                issue.severity === 'critical' ? 'contentCritical' : 'contentWarning'
                            }
                        >
                            {bullet}
                        </BulletListItem>
                    ))}
                </VStack>
            )}
        </AnimatedFullAlertBox>
    );
};
