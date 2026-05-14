import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { Translation, useTranslation } from '@suite/intl';
import { Icon, Input, KEYBOARD_CODE, Modal, Paragraph } from '@trezor/components';
import { borders, spacings, zIndices } from '@trezor/theme';

import { CommandPaletteItem } from './CommandPaletteItem';
import { useCommandPalette } from './CommandPaletteProvider';
import { type Command, CommandCategory } from './commands/types';
import { useCommandRegistry } from './useCommandRegistry';
import { useCommandSearch } from './useCommandSearch';

const Container = styled.div`
    width: 100%;
    max-width: 640px;
    margin-top: 15vh;
    background: ${({ theme }) => theme.surfaceFillRaised};
    border: 1px solid ${({ theme }) => theme.borderNeutral};
    border-radius: ${borders.radii.md};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

const ResultsList = styled.div`
    max-height: 400px;
    overflow-y: auto;
    padding: ${spacings.xs}px;
`;

const GroupHeader = styled.div`
    padding: ${spacings.xs}px ${spacings.md}px;
    padding-top: ${spacings.sm}px;
`;

const Footer = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacings.md}px;
    padding: ${spacings.xs}px ${spacings.md}px;
    border-top: 1px solid ${({ theme }) => theme.borderNeutral};
`;

const Kbd = styled.kbd`
    font-family: inherit;
    font-size: 11px;
    padding: 1px ${spacings.xxs}px;
    border-radius: ${borders.radii.xs};
    background: ${({ theme }) => theme.surfaceFillSunken};
    border: 1px solid ${({ theme }) => theme.borderNeutral};
`;

const EmptyState = styled.div`
    padding: ${spacings.xl}px;
    text-align: center;
`;

const categoryOrder: CommandCategory[] = [
    CommandCategory.Navigation,
    CommandCategory.Action,
    CommandCategory.Settings,
    CommandCategory.Account,
];

const categoryLabels: Record<CommandCategory, string> = {
    [CommandCategory.Navigation]: 'TR_COMMAND_PALETTE_CATEGORY_NAVIGATION',
    [CommandCategory.Action]: 'TR_COMMAND_PALETTE_CATEGORY_ACTIONS',
    [CommandCategory.Settings]: 'TR_COMMAND_PALETTE_CATEGORY_SETTINGS',
    [CommandCategory.Account]: 'TR_COMMAND_PALETTE_CATEGORY_ACCOUNTS',
};

type CommandGroup = {
    category: CommandCategory;
    commands: Command[];
};

const groupCommands = (commands: Command[]): CommandGroup[] => {
    const groups = new Map<CommandCategory, Command[]>();

    for (const command of commands) {
        const existing = groups.get(command.category);
        if (existing) {
            existing.push(command);
        } else {
            groups.set(command.category, [command]);
        }
    }

    return categoryOrder
        .filter(category => groups.has(category))
        .map(category => ({
            category,
            commands: groups.get(category)!,
        }));
};

const getFlatIndex = (groups: CommandGroup[], groupIndex: number, itemIndex: number): number => {
    let index = 0;
    for (let g = 0; g < groupIndex; g++) {
        index += groups[g].commands.length;
    }

    return index + itemIndex;
};

const getTotalCount = (groups: CommandGroup[]): number =>
    groups.reduce((sum, group) => sum + group.commands.length, 0);

export const CommandPalette = () => {
    const { isOpen, close } = useCommandPalette();
    const { translationString } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const commands = useCommandRegistry();
    const filteredCommands = useCommandSearch(commands, query);
    const groups = groupCommands(filteredCommands);
    const totalCount = getTotalCount(groups);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [isOpen]);

    const executeCommand = useCallback(
        (command: Command) => {
            close();
            command.execute();
        },
        [close],
    );

    const getCommandAtIndex = useCallback(
        (index: number): Command | undefined => {
            let remaining = index;
            for (const group of groups) {
                if (remaining < group.commands.length) {
                    return group.commands[remaining];
                }
                remaining -= group.commands.length;
            }

            return undefined;
        },
        [groups],
    );

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.code === KEYBOARD_CODE.ARROW_DOWN) {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % totalCount);
            } else if (e.code === KEYBOARD_CODE.ARROW_UP) {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + totalCount) % totalCount);
            } else if (e.code === KEYBOARD_CODE.ENTER) {
                e.preventDefault();
                const command = getCommandAtIndex(selectedIndex);
                if (command) {
                    executeCommand(command);
                }
            } else if (e.code === KEYBOARD_CODE.ESCAPE) {
                e.preventDefault();
                close();
            }
        },
        [totalCount, selectedIndex, getCommandAtIndex, executeCommand, close],
    );

    const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setSelectedIndex(0);
    }, []);

    if (!isOpen) return null;

    return (
        <Modal.Backdrop
            onClick={close}
            alignment={{ x: 'center', y: 'start' }}
            zIndex={zIndices.modal}
            data-testid="@command-palette"
        >
            <Container onKeyDown={handleKeyDown}>
                <Input
                    innerRef={inputRef}
                    isClean
                    size="large"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder={translationString('TR_COMMAND_PALETTE_PLACEHOLDER')}
                    showClearButton={query.length > 0 || undefined}
                    onClear={() => {
                        setQuery('');
                        setSelectedIndex(0);
                    }}
                    leftContent={<Icon name="magnifyingGlass" size={20} />}
                    data-testid="@command-palette/input"
                />
                <ResultsList>
                    {totalCount === 0 && query.length > 0 && (
                        <EmptyState>
                            <Paragraph intent="neutral" priority="secondary">
                                <Translation id="TR_COMMAND_PALETTE_NO_RESULTS" />
                            </Paragraph>
                        </EmptyState>
                    )}
                    {groups.map((group, groupIndex) => (
                        <div key={group.category}>
                            <GroupHeader>
                                <Paragraph
                                    typographyStyle="body-xs"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation
                                        id={
                                            categoryLabels[group.category] as Parameters<
                                                typeof Translation
                                            >[0]['id']
                                        }
                                    />
                                </Paragraph>
                            </GroupHeader>
                            {group.commands.map((command, itemIndex) => (
                                <CommandPaletteItem
                                    key={command.id}
                                    command={command}
                                    isSelected={
                                        getFlatIndex(groups, groupIndex, itemIndex) ===
                                        selectedIndex
                                    }
                                    onSelect={() => executeCommand(command)}
                                    onHover={() =>
                                        setSelectedIndex(
                                            getFlatIndex(groups, groupIndex, itemIndex),
                                        )
                                    }
                                />
                            ))}
                        </div>
                    ))}
                </ResultsList>
                <Footer>
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Kbd>↑↓</Kbd> <Translation id="TR_COMMAND_PALETTE_NAVIGATE" /> <Kbd>↵</Kbd>{' '}
                        <Translation id="TR_COMMAND_PALETTE_SELECT" /> <Kbd>Esc</Kbd>{' '}
                        <Translation id="TR_COMMAND_PALETTE_CLOSE" />
                    </Paragraph>
                </Footer>
            </Container>
        </Modal.Backdrop>
    );
};
