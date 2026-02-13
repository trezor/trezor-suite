import { Translation } from '@suite/intl';
import { Paragraph } from '@trezor/components';

export const EarnNotAvailableText = () => (
    <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
        <Translation id="TR_EARN_NOT_AVAILABLE" />
    </Paragraph>
);
