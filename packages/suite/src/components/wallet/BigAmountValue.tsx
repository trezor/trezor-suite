import styled from 'styled-components';

import { Locale } from '@suite-common/suite-types';
import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/wallet-utils';
import { Row, TOOLTIP_DELAY_LONG, Text, Tooltip } from '@trezor/components';

import { selectLanguage } from 'src/selectors/suite/suiteSelectors';

import { useSelector } from '../../hooks/suite';

const FIAT_AMOUNT_CURRENCY_NBSP = '\u00A0';
// Short format is "48,3K Kč" or "48.35M CZK" – amount part ends with K/M/B/T
const SHORT_FIAT_AMOUNT_REGEX = /[\d.,\s]+[KMBT]$/;

const PrimaryPart = styled.span`
    font-variant-numeric: tabular-nums;
`;

const SecondaryPart = styled.span`
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.565px;
`;

type BigAmountValueProps = {
    formattedStringAmount: string;
    'data-testid'?: string;
    size: 'large' | 'medium';
    /** When set (e.g. full fiat amount for short-format tooltip), shown in tooltip with long delay */
    tooltipContent?: string | null;
};

const isShortFiatFormat = (str: string): boolean => {
    const parts = str.split(FIAT_AMOUNT_CURRENCY_NBSP);

    return parts.length === 2 && SHORT_FIAT_AMOUNT_REGEX.test(parts[0].trim());
};

export const BigAmountValue = ({
    formattedStringAmount,
    'data-testid': dataTestId,
    size,
    tooltipContent,
}: BigAmountValueProps) => {
    const language = useSelector(selectLanguage);
    const shouldRedactNumbers = useShouldRedactNumbers();

    const isShortFiat = isShortFiatFormat(formattedStringAmount);

    const wrapWithTooltip = (content: React.ReactNode) =>
        tooltipContent ? (
            <Tooltip
                hasArrow
                content={tooltipContent}
                delayShow={TOOLTIP_DELAY_LONG}
                display="inline-block"
            >
                {content}
            </Tooltip>
        ) : (
            content
        );

    if (isShortFiat) {
        const [amountPart, currencyPart] = formattedStringAmount.split(FIAT_AMOUNT_CURRENCY_NBSP);
        const headlineStyle = size === 'large' ? 'headline-lg' : 'headline-md';

        return wrapWithTooltip(
            <Row alignItems="baseline" data-testid={dataTestId} gap={8}>
                <Text typographyStyle={headlineStyle}>
                    <PrimaryPart>
                        {shouldRedactNumbers ? redactNumericalSubstring(amountPart) : amountPart}
                    </PrimaryPart>
                </Text>
                {!shouldRedactNumbers && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <SecondaryPart>{currencyPart}</SecondaryPart>
                    </Text>
                )}
            </Row>,
        );
    }

    // Todo: this is ugly hack, shall be refactored to some more safe alternative
    const shouldFormatLocale: Locale[] = ['en-US', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'];
    const [whole, separator, fractional] = shouldFormatLocale.includes(language)
        ? formattedStringAmount.split(/(\.)/)
        : formattedStringAmount.split(/(,)/);

    return wrapWithTooltip(
        <Row alignItems="baseline" data-testid={dataTestId}>
            <Text typographyStyle={size === 'large' ? 'headline-lg' : 'headline-md'}>
                <PrimaryPart>
                    {shouldRedactNumbers ? redactNumericalSubstring(whole) : whole}
                </PrimaryPart>
            </Text>
            {!shouldRedactNumbers && (
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <SecondaryPart>
                        {separator}
                        {fractional}
                    </SecondaryPart>
                </Text>
            )}
        </Row>,
    );
};
