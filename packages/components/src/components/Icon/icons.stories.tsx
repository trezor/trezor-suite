import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import {
    IconName,
    icons,
    Icon,
    IconProps,
    allowedIconFrameProps,
    iconVariants,
    iconSizes,
} from './Icon';
import { getFramePropsStory } from '../../utils/frameProps';
import { Input } from '../form/Input/Input';
import { typography } from '@trezor/theme';

const CopiedText = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${({ theme }) => theme.textAlertBlue};
    ${typography.hint}
`;

const Wrapper = styled.div`
    display: grid;
    width: 100%;
    grid-gap: 5px;
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
    padding-bottom: 10px;
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
`;

const meta: Meta = {
    title: 'Icons',
} as Meta;
export default meta;

const Render = (props: IconProps) => {
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState<string | null>(null);
    const theme = useTheme();
    const copy = (iconKey: string) => {
        navigator.clipboard.writeText(iconKey);
        setCopied(iconKey);
        setTimeout(() => setCopied(null), 1000);
    };

    return (
        <>
            <Input
                placeholder="Search icon"
                value={search}
                onChange={event => setSearch(event.target.value)}
                autoFocus={theme.legacy.THEME === 'light'}
                onClear={() => setSearch('')}
                showClearButton="always"
            />
            <Wrapper>
                {Object.keys(icons)
                    .filter(iconKey => {
                        const regex = new RegExp(search, 'i');

                        return Array.isArray(iconKey.match(regex));
                    })
                    .map(iconKey => {
                        return copied === iconKey ? (
                            <CopiedText>Copied to clipboard!</CopiedText>
                        ) : (
                            <IconWrapper key={iconKey} onClick={() => copy(iconKey)}>
                                <Icon {...props} name={iconKey as IconName} />
                                <IconText>{iconKey}</IconText>
                            </IconWrapper>
                        );
                    })}
            </Wrapper>
        </>
    );
};

export const AllIcons: StoryObj<IconProps> = {
    render: Render,
    args: {
        color: undefined,
        size: 'large',
        ...getFramePropsStory(allowedIconFrameProps).args,
    },
    argTypes: {
        variant: {
            options: iconVariants,
            control: {
                type: 'select',
            },
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
