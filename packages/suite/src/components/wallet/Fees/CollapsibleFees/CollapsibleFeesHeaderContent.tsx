import { type TranslationKey } from '@suite/intl';
import { Collapsible, Row } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { CollapsibleFeesHeader } from './CollapsibleFeesHeader';
import { MaximumFee } from './MaximumFee';
import { type useTransactionMaxFee } from './hooks/useTransactionMaxFee';

export type CollapsibleFeesHeaderContentProps = {
    label?: TranslationKey;
    headerTypographyStyle?: TypographyStyle;
    supportsAdjustableFees: boolean;
    txMaxFee: ReturnType<typeof useTransactionMaxFee>;
    isOpen?: boolean;
};

export const CollapsibleFeesHeaderContent = ({
    label,
    headerTypographyStyle = 'body-md',
    supportsAdjustableFees,
    txMaxFee,
    isOpen,
}: CollapsibleFeesHeaderContentProps) => {
    const content = (
        <Row
            justifyContent="space-between"
            gap={12}
            data-testid="@wallet/fees/collapsible-fees-toggle"
        >
            <CollapsibleFeesHeader label={label} typographyStyle={headerTypographyStyle} />
            <Row gap={16}>
                <MaximumFee typographyStyle={headerTypographyStyle} txMaxFee={txMaxFee} />
                {supportsAdjustableFees && (
                    <Collapsible.ToggleIcon iconName="caretDown" size={20} />
                )}
            </Row>
        </Row>
    );

    return isOpen !== undefined ? content : <Collapsible.Toggle>{content}</Collapsible.Toggle>;
};
