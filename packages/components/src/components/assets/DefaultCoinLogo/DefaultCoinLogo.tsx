import styled from 'styled-components';

const DEFAULT_CHARACTER = '?';

type DefaultCoinLogoProps = {
    coinFirstCharacter?: string;
    size?: number;
};

type DefaultWrapperProps = {
    $size?: number;
};

const DefaultWrapper = styled.div<DefaultWrapperProps>(
    ({ $size, theme }) => `
      width: ${$size}px;
      height: ${$size}px;
      border-radius: 50%;
      font-color: ${theme.iconSubdued};
      background-color: ${theme.backgroundSurfaceElevation0};
      font-weight: bold;
      font-size: ${$size && $size * 0.75}px;
  `,
);

export const DefaultCoinLogo = ({
    coinFirstCharacter = DEFAULT_CHARACTER,
    size = 32,
}: DefaultCoinLogoProps) => <DefaultWrapper $size={size}>{coinFirstCharacter}</DefaultWrapper>;
