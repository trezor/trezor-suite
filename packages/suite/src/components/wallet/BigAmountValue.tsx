import styled from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { type Locale } from '@suite-common/suite-types';
import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/wallet-utils';
import { Row, Text } from '@trezor/components';

import { useSelector } from '../../hooks/suite';

const WholeValue = styled.span`
    font-variant-numeric: tabular-nums;
`;

const DecimalValue = styled.span`
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.565px;
`;

type BigAmountValueProps = {
    formattedStringAmount: string;
    'data-testid'?: string;
    size: 'large' | 'medium';
};

export const BigAmountValue = ({
    formattedStringAmount,
    'data-testid': dataTestId,
    size,
}: BigAmountValueProps) => {
    const language = useSelector(selectLanguage);

    // Todo: this is ugly hack, shall be refactored to some more safe alternative
    const shouldFormatLocale: Locale[] = ['en-US', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'];
    const [whole, separator, fractional] = shouldFormatLocale.includes(language)
        ? formattedStringAmount.split(/(\.)/)
        : formattedStringAmount.split(/(,)/);

    const shouldRedactNumbers = useShouldRedactNumbers();

    return (
        <Row alignItems="baseline" data-testid={dataTestId}>
            <Text typographyStyle={size === 'large' ? 'headline-lg' : 'headline-md'}>
                <WholeValue>
                    {shouldRedactNumbers ? redactNumericalSubstring(whole) : whole}
                </WholeValue>
            </Text>
            {!shouldRedactNumbers && (
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <DecimalValue>
                        {separator}
                        {fractional}
                    </DecimalValue>
                </Text>
            )}
        </Row>
    );
};
