import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { Icon, IconProps, allowedIconFrameProps, iconVariants, iconSizes } from './Icon';
import { getFramePropsStory } from '../../utils/frameProps';
import { Input } from '../form/Input/Input';
import { Checkbox } from '../form/Checkbox/Checkbox';
import { Text } from '../typography/Text/Text';
import { typography } from '@trezor/theme';
import { icons, IconName } from '@suite-common/icons';
import {
    icons as iconsDeprecated,
    IconName as IconNameDeprecated,
} from '@suite-common/icons-deprecated';

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
    word-break: break-word;
    overflow-wrap: break-word;
    text-align: center;
`;

const meta: Meta = {
    title: 'Icons',
} as Meta;
export default meta;

const Render = (props: IconProps) => {
    const [search, setSearch] = useState('');
    const [isDeprecatedVisible, setIsDeprecatedVisible] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const theme = useTheme();

    const iconNames = new Set(Object.keys(icons) as IconName[]);
    const iconsDeprecatedNames = new Set(Object.keys(iconsDeprecated) as IconNameDeprecated[]);
    const allIcons = new Set(
        [...iconNames, ...iconsDeprecatedNames].sort((a, b) => a.localeCompare(b)),
    );

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
                    autoFocus={theme.legacy.THEME === 'light'}
                    onClear={() => setSearch('')}
                    showClearButton="always"
                />
                <Checkbox
                    isChecked={isDeprecatedVisible}
                    onClick={() => setIsDeprecatedVisible(!isDeprecatedVisible)}
                    labelAlignment="right"
                >
                    Show deprecated
                </Checkbox>
            </FloatingWrapper>
            <Wrapper>
                {[...(isDeprecatedVisible ? allIcons : iconNames)]
                    .filter(iconKey => new RegExp(search, 'i').test(iconKey))
                    .map(iconKey => {
                        const isDeprecated =
                            iconsDeprecatedNames.has(iconKey as IconNameDeprecated) &&
                            !iconNames.has(iconKey as IconName);

                        return copied === iconKey ? (
                            <CopiedText>Copied to clipboard!</CopiedText>
                        ) : (
                            <IconWrapper key={iconKey} onClick={() => copy(iconKey)}>
                                <Icon {...props} name={iconKey as IconName | IconNameDeprecated} />
                                <IconText>
                                    <span>{iconKey}</span>
                                    {isDeprecated && (
                                        <Text color={theme.borderInputDefault}>(deprecated)</Text>
                                    )}
                                </IconText>
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
