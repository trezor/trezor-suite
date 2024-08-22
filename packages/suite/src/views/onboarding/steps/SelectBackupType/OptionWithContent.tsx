import { Radio, Row, variables, Text, IconLegacy, useElevation, Tooltip } from '@trezor/components';
import { BackupType } from '../../../../reducers/onboarding/onboardingReducer';
import { ReactNode, forwardRef } from 'react';
import { Translation } from 'src/components/suite';
import { useLayoutSize } from 'src/hooks/suite';
import styled, { css } from 'styled-components';
import {
    spacingsPx,
    borders,
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
} from '@trezor/theme';
import { typesToLabelMap } from './typesToLabelMap';

export const OptionText = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
`;

export const OptionStyled = styled.div<{ $hasHoverInteraction?: boolean; $disabled?: boolean }>`
    display: flex;
    flex-direction: row;

    gap: ${spacingsPx.md};

    padding-top: ${spacingsPx.sm};
    padding-bottom: ${spacingsPx.sm};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding-top: ${spacingsPx.xs};
        padding-bottom: ${spacingsPx.xs};
    }

    align-items: center;
    cursor: pointer;

    color: ${({ $disabled, theme }) => ($disabled ? theme.textSubdued : undefined)};

    ${({ $hasHoverInteraction }) =>
        $hasHoverInteraction === true
            ? css`
                  &:hover {
                      background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};
                      transition: background 0.2s ease;

                      margin-left: -10px;
                      margin-right: -10px;
                      padding-left: 10px;
                      padding-right: 10px;

                      ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
                          margin-left: -6px;
                          margin-right: -6px;
                          padding-left: 6px;
                          padding-right: 6px;
                      }

                      border-radius: ${borders.radii.xs};
                  }
              `
            : ''};
`;

const DownIconCircle = styled.div<{ $elevation: Elevation }>`
    border-radius: ${borders.radii.full};
    border: 1px solid ${mapElevationToBorder};
    background: ${mapElevationToBackground};
    height: 36px;
    width: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
`;

const ArrowDown = () => {
    const { elevation } = useElevation();

    return (
        <DownIconCircle $elevation={elevation}>
            <IconLegacy icon="ARROW_DOWN" size={16} />
        </DownIconCircle>
    );
};

type OptionProps = {
    children: ReactNode;
    onSelect: () => void;
    isChecked: boolean;
    'data-testid'?: string;
    disabled?: boolean;
};

const Option = ({
    children,
    onSelect,
    isChecked,
    'data-testid': dataTest,
    disabled,
}: OptionProps) => (
    <OptionStyled
        onClick={disabled ? undefined : onSelect}
        $hasHoverInteraction={!disabled}
        $disabled={disabled}
    >
        <Radio
            isChecked={isChecked}
            onClick={onSelect}
            data-testid={dataTest}
            isDisabled={disabled}
        />
        {children}
    </OptionStyled>
);

type SelectedOptionProps = { children: ReactNode; onClick: () => void; isDisabled: boolean };

const SelectedOptionStyled = styled.div<{ $isDisabled: boolean }>`
    cursor: ${({ $isDisabled }) => ($isDisabled ? undefined : 'pointer')};

    padding: ${spacingsPx.xxs} ${spacingsPx.xl};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding: 0 ${spacingsPx.sm};
    }
`;

export const SelectedOption = forwardRef<HTMLDivElement, SelectedOptionProps>(
    ({ children, onClick, isDisabled }, ref) => (
        <SelectedOptionStyled $isDisabled={isDisabled}>
            <OptionStyled ref={ref} onClick={isDisabled ? undefined : onClick}>
                <div>
                    <IconLegacy icon="BACKUP" size={24} />
                </div>
                {children}
                <ArrowDown />
            </OptionStyled>
        </SelectedOptionStyled>
    ),
);
type OptionWithContentProps = {
    value: BackupType;
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    children?: ReactNode;
    tags: ReactNode;
    disabled?: boolean;
    tooltip?: ReactNode;
};

export const OptionWithContent = ({
    onSelect,
    selected,
    value,
    children,
    tags,
    disabled,
    tooltip,
}: OptionWithContentProps) => {
    const { isMobileLayout } = useLayoutSize();

    const inner = (
        <Option
            onSelect={() => onSelect(value)}
            isChecked={selected === value}
            data-testid={`@onboarding/select-seed-type-${value}`}
            disabled={disabled}
        >
            <OptionText>
                <Row alignItems="center">
                    <Text typographyStyle={isMobileLayout ? 'highlight' : 'titleSmall'}>
                        <Translation id={typesToLabelMap[value]} />
                    </Text>
                    {tags}
                </Row>
                <Text variant="tertiary">{children}</Text>
            </OptionText>
        </Option>
    );

    return tooltip !== undefined ? <Tooltip content={tooltip}>{inner}</Tooltip> : inner;
};
