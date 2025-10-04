import { ReactNode, useState } from 'react';

import {
    Banner,
    BannerVariant,
    Box,
    Button,
    Card,
    Column,
    IconName,
    Modal,
    Row,
    SelectBar,
    Text,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { typedObjectKeys } from '@trezor/utils';

import { TroubleshootingTipsList } from './TroubleshootingTipsList';
import { useLayoutSize } from '../../../hooks/suite';
import { Translation } from '../Translation';
import { TroubleshootingTipsFooter } from './TroubleshootingTipsFooter';

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

    const TroubleshootingButton = () => {
        const [isTroubleshootingModalVisible, setIsTroubleshootingModalVisible] = useState(false);
        const onOpen = () => {
            setIsTroubleshootingModalVisible(true);
        };
        const onCancel = () => {
            setIsTroubleshootingModalVisible(false);
        };

        return (
            <Column
                alignItems="center"
                data-testid={dataTest || '@onboarding/troubleshooting-tips'}
            >
                <Button
                    onClick={onOpen}
                    variant="info"
                    size="small"
                    isSubtle={!initiallyIsOpen}
                    icon="question"
                    data-testid="@onboarding/troubleshooting-tips/button"
                >
                    {toggleText ?? <Translation id="TR_TROUBLE_SHOOTING_TIPS" />}
                </Button>
                {isTroubleshootingModalVisible && (
                    <Modal
                        heading={toggleText ?? <Translation id="TR_TROUBLE_SHOOTING_TIPS" />}
                        onCancel={onCancel}
                        variant="info"
                        bottomContent={<TroubleshootingTipsFooter />}
                        data-testid="@onboarding/troubleshooting-tips/modal"
                    >
                        <Card header={labelRow}>
                            <TroubleshootingTipsList items={items[selectedSection].items} />
                        </Card>
                    </Modal>
                )}
            </Column>
        );
    };

    return cta ? (
        <Column gap={80} alignItems="center">
            <ActionBanner />
            <TroubleshootingButton />
        </Column>
    ) : (
        <Box margin={{ top: 80 }}>
            <TroubleshootingButton />
        </Box>
    );
};

export const TroubleshootingTips = ({ items, ...props }: TroubleshootingTipsProps) => (
    <TroubleshootingTipsWithSections
        {...props}
        // key is arbitrary, label won't be displayed with only one section
        items={{ default: { items, label: '' } }}
    />
);
