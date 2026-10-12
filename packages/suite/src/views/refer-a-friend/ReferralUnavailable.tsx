import { Translation, type TranslationKey } from '@suite/intl';
import { Card, Column, H2, Paragraph } from '@trezor/components';

type ReferralUnavailableProps = {
    description: TranslationKey;
};

export const ReferralUnavailable = ({ description }: ReferralUnavailableProps) => (
    <Card data-testid="@referral/unavailable">
        <Column padding={{ vertical: 32, horizontal: 16 }} gap={8} alignItems="center">
            <H2 typographyStyle="headline-md" align="center">
                <Translation id="TR_REFER_A_FRIEND" />
            </H2>
            <Paragraph intent="neutral" priority="secondary" align="center">
                <Translation id={description} />
            </Paragraph>
        </Column>
    </Card>
);
