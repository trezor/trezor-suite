import { Icon, Paragraph, Row } from '@trezor/components';
import { Translation } from '../Translation';
import { spacings } from '@trezor/theme';
import { RowSubheading } from './types';

interface SubheadingProps {
    subheading: RowSubheading;
    isExpanded?: boolean;
}

export const Subheading = ({ isExpanded, subheading }: SubheadingProps) => {
    if (!isExpanded || !subheading) return null;

    return subheading.isCurrentStep ? (
        <Row gap={spacings.xxs}>
            <Icon name="mapPinFilled" variant="warning" size="medium" />
            <Paragraph variant="warning" typographyStyle="hint">
                <Translation id="TR_STAKING_YOU_ARE_HERE" />
            </Paragraph>
        </Row>
    ) : (
        <Paragraph variant="tertiary" typographyStyle="hint">
            {subheading.text}
        </Paragraph>
    );
};
