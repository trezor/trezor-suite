import { TranslationKey } from '@suite/intl';
import { Box, Collapsible, Row } from '@trezor/components';
import { TypographyStyle } from '@trezor/theme';

import { ContentFlex } from 'src/support/suite/ContentFlex';

import { CollapsibleFeesHeader } from './CollapsibleFeesHeader';
import { MaximumFee } from './MaximumFee';
import { useTransactionMaxFee } from './hooks/useTransactionMaxFee';

export type CollapsibleFeesHeaderContentProps = {
    label?: TranslationKey;
    headerTypographyStyle?: TypographyStyle;
    isHeaderRowLayout?: boolean;
    supportsAdjustableFees: boolean;
    txMaxFee: ReturnType<typeof useTransactionMaxFee>;
};

export const CollapsibleFeesHeaderContent = ({
    label,
    headerTypographyStyle = 'body',
    supportsAdjustableFees,
    isHeaderRowLayout,
    txMaxFee,
}: CollapsibleFeesHeaderContentProps) => {
    const content = (
        <ContentFlex justifyContent="space-between" gap={12}>
            <CollapsibleFeesHeader label={label} typographyStyle={headerTypographyStyle} />
            <Row gap={12}>
                <MaximumFee typographyStyle={headerTypographyStyle} txMaxFee={txMaxFee} />
                {supportsAdjustableFees && (
                    <Collapsible.ToggleIcon iconName="caretDown" size="mediumLarge" />
                )}
            </Row>
        </ContentFlex>
    );

    return (
        <Collapsible.Toggle data-testid="@wallet/fees/collapsible-fees-toggle">
            {isHeaderRowLayout ? (
                <Box
                    backgroundColorOnInteraction={
                        supportsAdjustableFees ? 'backgroundSurfaceElevation2' : undefined
                    }
                    padding={{ vertical: 12, horizontal: 16 }}
                >
                    {content}
                </Box>
            ) : (
                content
            )}
        </Collapsible.Toggle>
    );
};
