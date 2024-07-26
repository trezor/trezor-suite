import styled from 'styled-components';

const DEFAULT_CHARACTER = '?';

type DefaultCoinLogoProps = {
    coinFirstCharacter?: string;
    size?: number;
};

const DefaultWrapper = styled.div<{ $size?: number }>(
    ({ $size, theme }) => `
      width: ${$size}px;
      height: ${$size}px;
      border-radius: 50%;
      color: ${theme.iconSubdued};
      background-color: ${theme.backgroundSurfaceElevation0};
      font-weight: bold;
      font-size: ${$size && $size * 0.75}px;
      justify-content: center;
      align-items: center;
      text-align: center;
  `,
);

export const DefaultCoinLogo = ({
    coinFirstCharacter = DEFAULT_CHARACTER,
    size = 32,
}: DefaultCoinLogoProps) => <DefaultWrapper $size={size}>{coinFirstCharacter}</DefaultWrapper>;
