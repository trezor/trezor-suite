import { type ReactNode, useMemo } from 'react';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { type ExchangeIssue } from '@suite-common/trading';
import { Banner, List } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';

type TradingOfferExchangeIssueContent = {
    title: ReactNode;
    description: ReactNode;
};

const getIssueContent = (
    issue: ExchangeIssue,
    percentFormatter: Intl.NumberFormat,
): TradingOfferExchangeIssueContent => {
    switch (issue.type) {
        case 'high-risk-with-price-impact':
            return {
                title: <Translation id="TR_TRADING_HIGH_RISK_SWAP_TITLE" />,
                description: (
                    <List listStyleType="disc" gap={0}>
                        <List.Item>
                            <Translation id="TR_TRADING_HIGH_RISK_SWAP_DESCRIPTION" />
                        </List.Item>
                        <List.Item>
                            <Translation
                                id="TR_TRADING_PRICE_IMPACT_TITLE"
                                values={{ percent: percentFormatter.format(issue.deviation) }}
                            />
                        </List.Item>
                    </List>
                ),
            };
        case 'high-risk':
            return {
                title: <Translation id="TR_TRADING_HIGH_RISK_SWAP_TITLE" />,
                description: <Translation id="TR_TRADING_HIGH_RISK_SWAP_DESCRIPTION" />,
            };
        case 'price-impact':
            return {
                title: (
                    <Translation
                        id="TR_TRADING_PRICE_IMPACT_TITLE"
                        values={{ percent: percentFormatter.format(issue.deviation) }}
                    />
                ),
                description: <Translation id="TR_TRADING_PRICE_IMPACT_DESCRIPTION" />,
            };
        case 'slippage-too-low':
            return {
                title: <Translation id="TR_TRADING_SLIPPAGE_TOO_LOW_TITLE" />,
                description: <Translation id="TR_TRADING_SLIPPAGE_TOO_LOW_DESCRIPTION" />,
            };
        default:
            return exhaustive(issue);
    }
};

type TradingOfferExchangeIssueBannerProps = {
    issue: ExchangeIssue;
    isContinueDisabled: boolean;
    isContinueLoading: boolean;
    onContinueAnywayClick: () => void;
};

export const TradingOfferExchangeIssueBanner = ({
    issue,
    isContinueDisabled,
    isContinueLoading,
    onContinueAnywayClick,
}: TradingOfferExchangeIssueBannerProps) => {
    const language = useSelector(selectLanguage);

    const percentFormatter = useMemo(
        () =>
            new Intl.NumberFormat(language, {
                style: 'percent',
                maximumFractionDigits: 0,
            }),
        [language],
    );

    const { title, description } = getIssueContent(issue, percentFormatter);

    return (
        <Banner
            intent={issue.severity}
            title={title}
            description={description}
            data-testid="@trading/offer/issue-banner"
            rightContent={
                <Banner.Button
                    isDisabled={isContinueDisabled}
                    isLoading={isContinueLoading}
                    onClick={onContinueAnywayClick}
                    data-testid="@trading/offer/continue-anyway"
                >
                    <Translation id="TR_TRADING_CONTINUE_ANYWAY" />
                </Banner.Button>
            }
        />
    );
};
