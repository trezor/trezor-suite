import React, { useState } from 'react';

import { Meta, StoryObj } from '@storybook/react';
import styled, { useTheme } from 'styled-components';

import { IconName, icons } from '@suite-common/icons/src/icons';
import { typography } from '@trezor/theme';

import { Icon, IconProps, allowedIconFrameProps, iconSizes, iconVariants } from './Icon';
import { getFramePropsStory } from '../../utils/frameProps';
import { Input } from '../form/Input/Input';

const CopiedText = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${({ theme }) => theme.textAlertBlue};
    ${typography.hint}
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
    display: flex;
    flex-direction: column;
    align-items: center;
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
    overflow-wrap: anywhere;
    word-break: normal;
    text-align: center;
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
            <FloatingWrapper>
                <Input
                    placeholder="Search icon"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={theme.legacy.THEME === 'light'}
                    onClear={() => setSearch('')}
                    showClearButton="always"
                />
            </FloatingWrapper>
            <Wrapper>
                {(Object.keys(icons) as IconName[])
                    .filter(iconKey => new RegExp(search, 'i').test(iconKey))
                    .map(iconKey =>
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
        color: {
            control: 'color',
        },
        size: {
            options: Object.values(iconSizes),
            control: {
                type: 'select',
                labels: iconSizes,
            },
        },
        ...getFramePropsStory(allowedIconFrameProps).argTypes,
    },
};
