import { useMemo, useState } from 'react';

import styled from 'styled-components';

import {
    CATEGORY_FILTER_OPTIONS,
    messageSystemActions,
    selectAllInAppIds,
    selectAllValidMessages,
    selectMessageSystemConfig,
} from '@suite-common/message-system';
import { Action, Device, Localization, Message } from '@suite-common/suite-types';
import {
    Banner,
    BannerVariant,
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    Collapsible,
    Column,
    Divider,
    Icon,
    InfoItem,
    Modal,
    Paragraph,
    Row,
    SelectBar,
    TextButton,
    useElevation,
} from '@trezor/components';
import { mapVariantToBackgroundColor } from '@trezor/components/src/components/Banner/utils';
import { copyToClipboard } from '@trezor/dom-utils';
import { Elevation, borders, spacings, spacingsPx } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { MessageSystemForm } from './MessageSystemForm';

type CategoryFilterOption = (typeof CATEGORY_FILTER_OPTIONS)[number]['value'];

const MessageContainer = styled.div<{ $variant: BannerVariant; $elevation: Elevation }>`
    display: flex;
    gap: ${spacingsPx.sm};
    background: ${mapVariantToBackgroundColor};
    border-radius: ${borders.radii.sm};
    padding: ${spacingsPx.sm};
`;

const StyledList = styled.ul`
    list-style: none;
`;

const toCommaSeparatedString = (value: string | string[]) =>
    typeof value === 'string' ? value : value.join(', ');

const MessageTranslations = ({ messages }: { messages: Localization }) => {
    const [showAll, setShowAll] = useState(false);

    const handleToggle = () => setShowAll(prev => !prev);

    return (
        <Collapsible gap={0}>
            <InfoItem
                labelWidth="100%"
                label={
                    <Collapsible.Toggle>
                        <TextButton
                            icon={showAll ? 'caretUpFilled' : 'caretDownFilled'}
                            iconAlignment="end"
                            variant="tertiary"
                            onClick={handleToggle}
                        >
                            Translations ({Object.keys(messages).length}){' '}
                        </TextButton>
                    </Collapsible.Toggle>
                }
                variant="tertiary"
                iconName="translate"
            >
                <div>
                    {Object.entries(messages)
                        .filter(([lang]) => lang === 'en')
                        .map(([lang, text]) => (
                            <div key={lang}>
                                <strong>{lang}:</strong> {text}
                            </div>
                        ))}

                    <Collapsible.Content>
                        {Object.entries(messages)
                            .filter(([lang]) => lang !== 'en')
                            .map(([lang, text]) => (
                                <div key={lang}>
                                    <strong>{lang}:</strong> {text}
                                </div>
                            ))}
                    </Collapsible.Content>
                </div>
            </InfoItem>
        </Collapsible>
    );
};

const MessageDevices = ({ devices }: { devices?: Device[] }) => {
    const [expanded, setExpanded] = useState(false);

    if (!devices || devices.length === 0) {
        return (
            <InfoItem label="Devices" iconName="devices" variant="default">
                -
            </InfoItem>
        );
    }

    const firstDevice = devices[0];
    const restDevices = devices.slice(1);

    const handleToggle = () => setExpanded(prev => !prev);

    return (
        <Collapsible gap={0}>
            <InfoItem
                labelWidth="100%"
                label={
                    <Collapsible.Toggle>
                        <TextButton
                            icon={expanded ? 'caretUpFilled' : 'caretDownFilled'}
                            iconAlignment="end"
                            variant="tertiary"
                            onClick={handleToggle}
                        >
                            Devices ({devices.length})
                        </TextButton>
                    </Collapsible.Toggle>
                }
                iconName="devices"
                variant="default"
            >
                <div>
                    <strong>{firstDevice.model}</strong> (firmware: {firstDevice.firmware},
                    bootloader: {firstDevice.bootloader})
                </div>

                <Collapsible.Content>
                    {restDevices.map((d, i) => (
                        <div key={i}>
                            <strong>{d.model}</strong> (firmware: {d.firmware}, bootloader:{' '}
                            {d.bootloader})
                        </div>
                    ))}
                </Collapsible.Content>
            </InfoItem>
        </Collapsible>
    );
};

const MessageDetail = ({ message }: { message: Action['message'] }) => (
    <>
        <InfoItem label={message.id} typographyStyle="highlight" iconName="note" variant="default">
            <MessageTranslations messages={message.content} />
        </InfoItem>
        {message.context && (
            <InfoItem
                label="Context"
                iconName="codeBlockFilled"
                typographyStyle="highlight"
                variant="default"
            >
                {toCommaSeparatedString(message.context.domain)}
            </InfoItem>
        )}
        {message.feature && (
            <InfoItem
                label="Features"
                iconName="checkFat"
                typographyStyle="highlight"
                variant="default"
            >
                <StyledList>
                    {message.feature.map(feature => (
                        <li key={feature.domain}>
                            <strong>{feature.domain}:</strong>{' '}
                            {feature.flag ? 'enabled' : 'disabled'}
                        </li>
                    ))}
                </StyledList>
            </InfoItem>
        )}
        {message.cta && (
            <InfoItem
                label="CTA"
                iconName="cursorClick"
                typographyStyle="highlight"
                variant="default"
            >
                <div>
                    <MessageTranslations messages={message.cta.label} />
                    <div>
                        <strong>{message.cta.action}:</strong> {message.cta.link}
                    </div>
                </div>
            </InfoItem>
        )}
    </>
);

const MessageConditions = ({ conditions }: { conditions: Action['conditions'] }) => {
    if (!conditions || conditions.length === 0) {
        return (
            <InfoItem label="Conditions" iconName="checkFat" variant="default">
                -
            </InfoItem>
        );
    }

    return conditions.map(({ environment, os, devices, settings, countryCodes }, index) => (
        <Column key={index} gap={spacings.sm}>
            <Row gap={spacings.sm} alignItems="flex-start">
                <InfoItem label="Environment" iconName="devices" variant="default">
                    {environment ? (
                        <ul>
                            {Object.entries(environment).map(([key, value]) => (
                                <InfoItem
                                    key={key}
                                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                                    direction="row"
                                >
                                    {String(value)}
                                </InfoItem>
                            ))}
                        </ul>
                    ) : (
                        '-'
                    )}
                </InfoItem>

                <InfoItem label="Operating System" iconName="browsers" variant="default">
                    {os ? (
                        <ul>
                            {Object.entries(os).map(([key, value]) => (
                                <InfoItem
                                    key={key}
                                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                                    direction="row"
                                >
                                    {String(value)}
                                </InfoItem>
                            ))}
                        </ul>
                    ) : (
                        '-'
                    )}
                </InfoItem>

                <InfoItem label="Settings" iconName="coins" variant="default">
                    {settings
                        ? settings.map((setting, i) =>
                              Object.entries(setting).map(([key, value]) => (
                                  <InfoItem
                                      key={`${i}-${key}`}
                                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                                      direction="row"
                                  >
                                      {String(value)}
                                  </InfoItem>
                              )),
                          )
                        : '-'}
                </InfoItem>

                <InfoItem label="Country codes" iconName="globe" variant="default">
                    {countryCodes ? countryCodes.join(', ') : '-'}
                </InfoItem>
            </Row>
            <MessageDevices devices={devices} />
        </Column>
    ));
};

const MessageInfo = ({
    message,
    allValidMessages,
    isInApp,
}: {
    message: Message;
    allValidMessages: Message[];
    isInApp: boolean;
}) => (
    <Column gap={spacings.xs}>
        <InfoItem label="Active" iconName="info" direction="row">
            <Icon
                name="circleFilled"
                variant={
                    allValidMessages.some(m => m.id === message.id) ? 'primary' : 'destructive'
                }
            />
        </InfoItem>
        <InfoItem label="Source" iconName="cloud" direction="row">
            {isInApp ? 'in-app' : 'file'}
        </InfoItem>
        <InfoItem label="Category" iconName="info" direction="row">
            {toCommaSeparatedString(message.category)}
        </InfoItem>
        <InfoItem label="Variant" iconName="warning" direction="row">
            {message.variant}
        </InfoItem>
        <InfoItem label="Dismissible" iconName="xCircle" direction="row">
            {message.dismissible ? 'true' : 'false'}
        </InfoItem>
        <InfoItem label="Priority" iconName="fire" direction="row">
            {message.priority}
        </InfoItem>
    </Column>
);

type MessageFiltersProps = {
    showActive: boolean;
    onToggleActive: () => void;
    selectedCategory: CategoryFilterOption;
    onCategoryChange: (value: CategoryFilterOption) => void;
};

const MessageFilters = ({
    showActive,
    onToggleActive,
    selectedCategory,
    onCategoryChange,
}: MessageFiltersProps) => (
    <Row alignItems="center" justifyContent="space-between" gap={spacings.sm}>
        <SelectBar
            selectedOption={selectedCategory}
            options={[...CATEGORY_FILTER_OPTIONS]}
            size="small"
            onChange={value => {
                onCategoryChange(value);
            }}
        />
        <Checkbox onClick={onToggleActive} isChecked={showActive}>
            Show only active
        </Checkbox>
    </Row>
);

const MessageModal = ({
    actions,
    allValidMessages,
    allInAppIds,
    onCloseModal,
}: {
    actions: Action[];
    allValidMessages: Message[];
    allInAppIds: Record<string, boolean>;
    onCloseModal: () => void;
}) => {
    const dispatch = useDispatch();
    const { elevation } = useElevation();

    const [showActive, setIsActive] = useState<boolean>(true);
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilterOption>('all');

    const removeMessage = (id: string) => {
        dispatch(messageSystemActions.removeMessage(id));
    };

    const validMessageIdSet = useMemo(
        () => new Set(allValidMessages.map(message => message.id)),
        [allValidMessages],
    );

    const filteredActions = useMemo(() => {
        const isAllCategories = selectedCategory === 'all';

        return actions.filter(({ message }) => {
            const passesActiveFilter = !showActive || validMessageIdSet.has(message.id);

            const categories = Array.isArray(message.category)
                ? message.category
                : [message.category];

            const passesCategoryFilter = isAllCategories
                ? true
                : categories.includes(selectedCategory);

            return passesActiveFilter && passesCategoryFilter;
        });
    }, [actions, showActive, validMessageIdSet, selectedCategory]);

    return (
        <Modal
            size="huge"
            onCancel={onCloseModal}
            heading={`Messages (${allValidMessages.length} active of ${actions.length})`}
            bottomContent={<MessageSystemForm />}
        >
            <Column gap={spacings.sm}>
                <MessageFilters
                    showActive={showActive}
                    onToggleActive={() => setIsActive(prev => !prev)}
                    selectedCategory={selectedCategory}
                    onCategoryChange={category => {
                        setSelectedCategory(category);
                    }}
                />
                {filteredActions.length === 0 && <Banner variant="warning">No messages.</Banner>}

                {filteredActions.map(({ message, conditions }, index) => (
                    <MessageContainer
                        key={`${message.id}-${index}`}
                        $variant={message.variant === 'critical' ? 'destructive' : message.variant}
                        $elevation={elevation}
                    >
                        <Column flex="1" gap={spacings.md}>
                            <MessageDetail message={message} />
                            <Divider color="backgroundNeutralBold" />
                            <MessageConditions conditions={conditions} />
                        </Column>
                        <Column gap={spacings.xs}>
                            <MessageInfo
                                message={message}
                                allValidMessages={allValidMessages}
                                isInApp={allInAppIds[message.id]}
                            />
                            <Column alignItems="flex-end" gap={spacings.xs}>
                                <Button
                                    size="tiny"
                                    icon="copy"
                                    variant="primary"
                                    onClick={() =>
                                        copyToClipboard(
                                            JSON.stringify({ conditions, message }, null, 2),
                                        )
                                    }
                                >
                                    Copy to clipboard
                                </Button>
                                {allInAppIds[message.id] && (
                                    <Button
                                        size="tiny"
                                        icon="trash"
                                        variant="destructive"
                                        onClick={() => removeMessage(message.id)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </Column>
                        </Column>
                    </MessageContainer>
                ))}
            </Column>
        </Modal>
    );
};

export const MessageSystemDebugInfo = () => {
    const config = useSelector(selectMessageSystemConfig);
    const allValidMessages = useSelector(selectAllValidMessages);
    const allInAppIds = useSelector(selectAllInAppIds);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCopyConfig = () => {
        if (config === null) return;
        copyToClipboard(JSON.stringify(config, null, 2));
    };
    const handleOpenManageMessages = () => setIsModalOpen(true);
    const handleCloseValidMessages = () => setIsModalOpen(false);

    return (
        <>
            <Row justifyContent="space-between">
                <Box>
                    <Paragraph>Sequence: {config?.sequence}</Paragraph>
                    <Paragraph>Timestamp: {config?.timestamp}</Paragraph>
                </Box>
                <ButtonGroup size="small">
                    <Button onClick={handleCopyConfig}>Copy full config</Button>
                    <Button onClick={handleOpenManageMessages}>Message Manager</Button>
                </ButtonGroup>
            </Row>
            {isModalOpen && config && (
                <MessageModal
                    actions={config.actions}
                    allValidMessages={allValidMessages}
                    allInAppIds={allInAppIds}
                    onCloseModal={handleCloseValidMessages}
                />
            )}
        </>
    );
};
