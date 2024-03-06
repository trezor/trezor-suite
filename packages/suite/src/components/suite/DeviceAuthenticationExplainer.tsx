import styled, { css } from 'styled-components';

import { Icon, variables } from '@trezor/components';

import { Translation } from 'src/components/suite';

const Item = styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
    text-align: left;
`;

const Items = styled.div<{ $isHorizontal: DeviceAuthenticationExplainerProps['horizontal'] }>`
    display: grid;
    gap: 40px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    ${({ $isHorizontal }) =>
        $isHorizontal &&
        css`
            @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) {
                grid-template-columns: repeat(3, 1fr);

                ${Item} {
                    flex-direction: column;
                    text-align: center;
                }
            }
        `}
`;

const items = [
    { icon: 'SHIELD_CHECK', text: 'TR_DEVICE_AUTHENTICITY_ITEM_1' },
    { icon: 'CHIP', text: 'TR_DEVICE_AUTHENTICITY_ITEM_2' },
    { icon: 'CHECKLIST', text: 'TR_DEVICE_AUTHENTICITY_ITEM_3' },
] as const;

interface DeviceAuthenticationExplainerProps {
    horizontal?: boolean;
}

export const DeviceAuthenticationExplainer = ({
    horizontal,
}: DeviceAuthenticationExplainerProps) => (
    <Items $isHorizontal={horizontal}>
        {items.map(({ icon, text }) => (
            <Item key={icon}>
                <Icon icon={icon} size={32} />
                <Translation id={text} />
            </Item>
        ))}
    </Items>
);
