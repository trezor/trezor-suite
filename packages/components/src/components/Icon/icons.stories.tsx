import React, { useState } from 'react';

import { type Meta, type StoryObj } from '@storybook/react';
import styled from 'styled-components';

// TODO: suite-common imports in non-suite packages should not be allowed
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { type IconName, icons } from '@suite-common/icons/src/icons';
import { typography } from '@trezor/theme';

import { Icon, type IconProps, allowedIconFrameProps, iconIntents, iconPriorities } from './Icon';
import { iconSizes } from './types';
import { getFramePropsStory } from '../../utils/frameProps';
import { Input } from '../form/Input/Input';
import { Paragraph } from '../typography/Paragraph/Paragraph';

const MAX_RENDERED_ICONS = 500;

const CopiedText = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${({ theme }) => theme.textAlertBlue};
    ${typography['body-sm']}
`;

const FloatingWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    position: sticky;
    width: 100%;
    top: 0;
    padding: 10px 0;
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    box-shadow: 0 5px 10px ${({ theme }) => theme.backgroundSurfaceElevation0};
`;

const Wrapper = styled.div`
    display: grid;
    width: 100%;
    gap: 5px;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    margin-top: 8px;
`;

const IconWrapper = styled.div`
    display: flex;
    min-height: 100px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border-radius: 2px;
    padding: 5px;
    gap: 8px;

    &:hover {
        border: 1px dashed #f2ae7b;
    }
`;

const IconText = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    ${typography['body-xs']}
    color: ${({ theme }) => theme.textSubdued};
    overflow-wrap: anywhere;
    word-break: normal;
    text-align: center;
`;

const meta: Meta<typeof Render> = {
    title: 'Icons',
};
export default meta;

const Render = (props: IconProps) => {
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const copy = (iconKey: string) => {
        navigator.clipboard.writeText(iconKey);
        setCopied(iconKey);
        setTimeout(() => setCopied(null), 1000);
    };

    const iconKeys = Object.keys(icons);
    const filteredIconKeys = (iconKeys as IconName[]).filter(iconKey =>
        new RegExp(search, 'i').test(iconKey),
    );
    const filteredIconKeysWithLimit = filteredIconKeys.slice(0, MAX_RENDERED_ICONS);
    const filteredIconsCount = filteredIconKeys.length;

    return (
        <>
            <FloatingWrapper>
                <Input
                    placeholder="Search icon"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    onClear={() => setSearch('')}
                    showClearButton={true}
                />
            </FloatingWrapper>
            <Wrapper>
                {filteredIconKeysWithLimit.map(iconKey =>
                    copied === iconKey ? (
                        <CopiedText key={iconKey}>Copied to clipboard!</CopiedText>
                    ) : (
                        <IconWrapper key={iconKey} onClick={() => copy(iconKey)}>
                            <Icon {...props} name={iconKey} />
                            <IconText>{iconKey}</IconText>
                        </IconWrapper>
                    ),
                )}
            </Wrapper>
            {MAX_RENDERED_ICONS < filteredIconsCount && (
                <Paragraph
                    align="center"
                    intent="neutral"
                    priority="secondary"
                    margin={{ top: 40 }}
                >
                    For performance reasons showing <strong>{MAX_RENDERED_ICONS}</strong> of{' '}
                    <strong>{filteredIconsCount}</strong> icons. <br />
                    Try to adjust filter.
                </Paragraph>
            )}
        </>
    );
};

export const AllIcons: StoryObj<typeof meta> = {
    render: Render,
    args: {
        color: undefined,
        size: 24,
        ...getFramePropsStory(allowedIconFrameProps).args,
    },
    argTypes: {
        intent: {
            options: [undefined, ...iconIntents],
            control: {
                type: 'select',
            },
        },
        priority: {
            options: iconPriorities,
            control: {
                type: 'select',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        color: {
            control: 'color',
        },
        size: {
            options: iconSizes,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedIconFrameProps).argTypes,
    },
};
