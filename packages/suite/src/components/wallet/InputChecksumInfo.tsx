import styled, { css } from 'styled-components';
import { useTheme } from 'styled-components';
import { TooltipSymbol } from '../suite';
import { spacingsPx, borders } from '@trezor/theme';
import { TranslationKey, Translation } from '../suite/Translation';
import { useTranslation } from 'src/hooks/suite';
import { Icon } from '@suite-common/icons/src/webComponents';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
    width: 100%;
    justify-content: space-between;
    background-color: ${({ theme }) => theme.backgroundAlertBlueSubtleOnElevation1};
    border-radius: ${borders.radii.xxs};
    position: relative;
    margin: ${spacingsPx.xxs} 0 ${spacingsPx.sm} 0;
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    ${({ theme }) => css`
        ::before {
            content: '';
            position: absolute;
            top: -${spacingsPx.xs};
            left: 20px;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 8px solid ${theme.backgroundAlertBlueSubtleOnElevation1};
        }
    `};
`;

const Container = styled.div`
    display: flex;
    flex-direction: row;
    margin: 0;
    padding: 0;
`;

export const Divider = styled.div`
    height: inherit;
    align-self: stretch;
    width: 2px;
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};
    margin: -${spacingsPx.xs} ${spacingsPx.xs};
`;

interface InputChecksumInfoProps {
    message?: TranslationKey;
    tooltipContent?: TranslationKey;
}
export const InputChecksumInfo = ({ message, tooltipContent }: InputChecksumInfoProps) => {
    const { translationString } = useTranslation();
    const theme = useTheme();

    return (
        <Wrapper>
            <Container>
                <Icon name="doubleCheck" size="medium" color={theme.textAlertBlue} />
                <Divider />
                {message && <Translation id={message} />}
            </Container>
            {tooltipContent && (
                <TooltipSymbol
                    content={translationString(tooltipContent)}
                    iconColor={theme.textAlertBlue}
                    icon="QUESTION_FILLED"
                />
            )}
        </Wrapper>
    );
};
