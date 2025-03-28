import { ReactNode, useState } from 'react';

import {
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

import { TroubleshootingTipsFooter } from './TroubleshootingTipsFooter';
import { TroubleshootingTipsListCard } from './TroubleshootingTipsListCard';
import { TroubleshootingTipsToggle } from './TroubleshootingTipsToggle';

export type TroubleshootingTipsItem = {
    key: string;
    heading?: ReactNode;
    description?: ReactNode;
    hide?: boolean;
    noBullet?: boolean;
    icon?: IconName;
};

type SectionDefinition = { label: ReactNode; items: TroubleshootingTipsItem[] };

type TroubleshootingTipsWithSectionsProps<K extends string, T extends K> = {
    label: ReactNode;
    cta?: ReactNode;
    ctaLabel?: ReactNode;
    initiallyIsOpen?: boolean;
    'data-testid'?: string;
    items: Record<K, SectionDefinition>;
    defaultSection?: T;
    toggleText?: ReactNode;
};

export const TroubleshootingTipsWithSections = <K extends string, T extends K>({
    label,
    items,
    cta,
    ctaLabel,
    initiallyIsOpen,
    defaultSection,
    toggleText,
    'data-testid': dataTest,
}: TroubleshootingTipsWithSectionsProps<K, T>) => {
    const [isOpened, setIsOpened] = useState(initiallyIsOpen === true);
    const firstSectionKey = Object.keys(items)[0] as K;
    const [selectedSection, setSelectedSection] = useState<K>(defaultSection ?? firstSectionKey);

    const hasMultipleSections = Object.keys(items).length > 1;

    const headingRow = (
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
                        options={Object.entries(items).map(([k, v]) => ({
                            label: (v as SectionDefinition).label,
                            value: k as K,
                        }))}
                        selectedOption={selectedSection}
                        size="small"
                    />
                </Row>
            ) : undefined}
        </Row>
    );

    return (
        <Column gap={spacings.xxxxl} alignItems="center">
            {cta && (
                <Card width="auto">
                    <Row gap={spacings.md}>
                        {ctaLabel ?? label}
                        {cta}
                    </Row>
                </Card>
            )}

            <Collapsible
                isOpen={isOpened}
                data-testid={dataTest || '@onboarding/expand-troubleshooting-tips'}
            >
                <Column gap={spacings.md}>
                    <Collapsible.Toggle onClick={() => setIsOpened(!isOpened)}>
                        <Row justifyContent="center" flex="1" margin={{ bottom: spacings.xs }}>
                            <TroubleshootingTipsToggle isOpen={isOpened}>
                                {toggleText}
                            </TroubleshootingTipsToggle>
                        </Row>
                    </Collapsible.Toggle>
                    <Collapsible.Content>
                        <ElevationContext baseElevation={-1}>
                            <ElevationDown>
                                <Card paddingType="tiny" width="656px">
                                    <Column gap={spacings.sm} padding={{ vertical: spacings.sm }}>
                                        {headingRow}
                                        {/* Custom design, where upper card is -1, and this card is 1 */}
                                        <ElevationUp>
                                            <TroubleshootingTipsListCard
                                                items={items[selectedSection].items}
                                            />
                                        </ElevationUp>
                                        <TroubleshootingTipsFooter />
                                    </Column>
                                </Card>
                            </ElevationDown>
                        </ElevationContext>
                    </Collapsible.Content>
                </Column>
            </Collapsible>
        </Column>
    );
};

type TroubleshootingTipsProps = {
    label: ReactNode;
    cta?: ReactNode;
    initiallyIsOpen?: boolean;
    'data-testid'?: string;
    items: TroubleshootingTipsItem[];
    toggleText?: ReactNode;
};

export const TroubleshootingTips = ({ items, ...props }: TroubleshootingTipsProps) => (
    <TroubleshootingTipsWithSections
        {...props}
        // key is arbitrary, label won't be displayed with only one section
        items={{ default: { items, label: '' } }}
    />
);
