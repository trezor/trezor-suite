import { type MouseEvent, useCallback, useRef } from 'react';

import styled, { css } from 'styled-components';

import { useTranslation } from '@suite/intl';
import { Icon, Paragraph, Row } from '@trezor/components';
import { borders, spacings } from '@trezor/theme';

import { type Command } from './commands/types';

const ItemWrapper = styled.div<{ $isSelected: boolean }>`
    display: flex;
    align-items: center;
    gap: ${spacings.sm}px;
    padding: ${spacings.sm}px ${spacings.md}px;
    border-radius: ${borders.radii.sm};
    cursor: pointer;
    transition: background-color 0.1s ease;

    ${({ $isSelected, theme }) =>
        $isSelected
            ? css`
                  background: ${theme.surfaceFillActionHovered};
              `
            : css`
                  &:hover {
                      background: ${theme.surfaceFillActionHovered};
                  }
              `}
`;

const ShortcutHint = styled.span`
    font-size: 11px;
    padding: 2px ${spacings.xs}px;
    border-radius: ${borders.radii.xs};
    background: ${({ theme }) => theme.surfaceFillSunken};
    border: 1px solid ${({ theme }) => theme.borderNeutral};
    white-space: nowrap;
`;

type CommandPaletteItemProps = {
    command: Command;
    isSelected: boolean;
    onSelect: () => void;
    onHover: () => void;
};

export const CommandPaletteItem = ({
    command,
    isSelected,
    onSelect,
    onHover,
}: CommandPaletteItemProps) => {
    const { translationString } = useTranslation();
    const ref = useRef<HTMLDivElement>(null);

    const label = command.label ?? (command.labelKey ? translationString(command.labelKey) : '');
    const description =
        command.description ??
        (command.descriptionKey ? translationString(command.descriptionKey) : '');

    const handleClick = useCallback(
        (e: MouseEvent) => {
            e.preventDefault();
            onSelect();
        },
        [onSelect],
    );

    if (isSelected && ref.current) {
        ref.current.scrollIntoView({ block: 'nearest' });
    }

    return (
        <ItemWrapper
            ref={ref}
            $isSelected={isSelected}
            onClick={handleClick}
            onMouseEnter={onHover}
            data-testid={`@command-palette/item/${command.id}`}
        >
            <Icon name={command.icon} size={16} />
            <Row flex="1" gap={spacings.xs} alignItems="center">
                <Paragraph typographyStyle="body-md" ellipsisLineCount={1}>
                    {label}
                </Paragraph>
                {description && (
                    <Paragraph
                        typographyStyle="body-xs"
                        intent="neutral"
                        priority="secondary"
                        ellipsisLineCount={1}
                    >
                        {description}
                    </Paragraph>
                )}
            </Row>
            {command.shortcutHint && <ShortcutHint>{command.shortcutHint}</ShortcutHint>}
        </ItemWrapper>
    );
};
