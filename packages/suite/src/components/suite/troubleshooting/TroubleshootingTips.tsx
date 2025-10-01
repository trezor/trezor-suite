import { ReactNode, useState } from 'react';

import {
    Banner,
    BannerVariant,
    Card,
    Collapsible,
    Column,
    ElevationContext,
    ElevationDown,
    ElevationUp,
    IconName,
    Row,
    SelectBar,
    Text,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { typedObjectKeys } from '@trezor/utils';

import { TroubleshootingTipsFooter } from './TroubleshootingTipsFooter';
import { TroubleshootingTipsList } from './TroubleshootingTipsList';
import { TroubleshootingTipsToggle } from './TroubleshootingTipsToggle';
import { useLayoutSize } from '../../../hooks/suite';

export type TroubleshootingTipsItem = {
    key: string;
    heading?: ReactNode;
    description?: ReactNode;
    hide?: boolean;
    icon?: IconName;
};

type SectionDefinition = { label: ReactNode; items: TroubleshootingTipsItem[] };

type TroubleshootingTipsBaseProps = {
    label?: ReactNode;
    ctaLabel?: ReactNode;
    cta?: ReactNode;
    initiallyIsOpen?: boolean;
    'data-testid'?: string;
    toggleText?: ReactNode;
    variant?: BannerVariant;
};

type TroubleshootingTipsProps = TroubleshootingTipsBaseProps & {
    items: TroubleshootingTipsItem[];
};

type TroubleshootingTipsWithSectionsProps<
    K extends string,
    T extends K,
> = TroubleshootingTipsBaseProps & {
    items: Record<K, SectionDefinition>;
    defaultSection?: T;
};

export const TroubleshootingTipsWithSections = <K extends string, T extends K>({
    label,
    items,
    cta,
    ctaLabel,
    initiallyIsOpen,
    defaultSection,
    toggleText,
    variant = 'warning',
    'data-testid': dataTest,
}: TroubleshootingTipsWithSectionsProps<K, T>) => {
    const itemsKeys = typedObjectKeys(items);
    const firstSectionKey = itemsKeys[0];
    const [selectedSection, setSelectedSection] = useState<K>(defaultSection ?? firstSectionKey);

    const hasMultipleSections = itemsKeys.length > 1;

    // @TODO isn't `labelRow` duplicate information? If not, where to show it?
    const labelRow =
        label !== undefined || hasMultipleSections ? (
            <Row
                justifyContent="space-between"
                alignItems="center"
                margin={{ horizontal: spacings.sm }}
            >
                <Text typographyStyle="body">{label}</Text>

                {hasMultipleSections ? (
                    <Row>
                        <SelectBar<K>
                            onChange={setSelectedSection}
                            options={itemsKeys.map(key => ({
                                label: items[key].label,
                                value: key,
                            }))}
                            selectedOption={selectedSection}
                            size="small"
                        />
                    </Row>
                ) : undefined}
            </Row>
        ) : null;

    const ActionBanner = () => {
        const { isBelowMobile } = useLayoutSize();

        return (
            <Banner rightContent={cta} variant={variant} minWidth={isBelowMobile ? undefined : 400}>
                {ctaLabel ?? label}
            </Banner>
        );
    };

    const CollapsibleTroubleshooting = () => (
        <Collapsible
            defaultIsOpen={initiallyIsOpen === true}
            data-testid={dataTest || '@onboarding/expand-troubleshooting-tips'}
        >
            <Column gap={spacings.sm} margin={{ top: 40 }}>
                <Collapsible.Toggle>
                    <Row justifyContent="center" flex="1" margin={{ bottom: spacings.xs }}>
                        <TroubleshootingTipsToggle>{toggleText}</TroubleshootingTipsToggle>
                    </Row>
                </Collapsible.Toggle>
                <Collapsible.Content>
                    <ElevationContext baseElevation={-1}>
                        <ElevationDown>
                            <Card paddingType="small" maxWidth="656px">
                                <Column gap={spacings.sm}>
                                    {labelRow}
                                    {/* Custom design, where upper card is -1, and this card is 1 */}
                                    <ElevationUp>
                                        <Card>
                                            <TroubleshootingTipsList
                                                items={items[selectedSection].items}
                                            />
                                        </Card>
                                    </ElevationUp>
                                    <TroubleshootingTipsFooter />
                                </Column>
                            </Card>
                        </ElevationDown>
                    </ElevationContext>
                </Collapsible.Content>
            </Column>
        </Collapsible>
    );

    return (
        <Column gap={spacings.xxxxl} alignItems="center">
            {cta && <ActionBanner />}
            <CollapsibleTroubleshooting />
        </Column>
    );
};

export const TroubleshootingTips = ({ items, ...props }: TroubleshootingTipsProps) => (
    <TroubleshootingTipsWithSections
        {...props}
        // key is arbitrary, label won't be displayed with only one section
        items={{ default: { items, label: '' } }}
    />
);
