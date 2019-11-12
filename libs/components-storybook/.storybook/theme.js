import { create } from '@storybook/theming';
import { colors, variables } from '@trezor/components';

export default create({
  base: colors.MAIN,

  colorPrimary: colors.GREEN_PRIMARY,
  colorSecondary: colors.GREEN_SECONDARY,

  // UI
  appBg: colors.BODY,
  appContentBg: colors.MAIN,
  appBorderColor: colors.DIVIDER,
  appBorderRadius: 4,

  // Typography
  fontBase: variables.FONT_FAMILY.DEFAULT,
  fontCode: variables.FONT_FAMILY.MONOSPACE,

  // Text colors
  textColor: colors.TEXT_PRIMARY,
  textInverseColor: colors.TEXT_SECONDARY,

  // Toolbar default and active colors
  barTextColor: colors.TEXT_PRIMARY,
  barSelectedColor: colors.TEXT_SECONDARY,
  barBg: colors.WHITE,

  // Form colors
  inputBg: colors.WHITE,
  inputBorder: colors.INPUT_BORDER,
  inputTextColor: colors.TEXT_PRIMARY,
  inputBorderRadius: 4,

  brandTitle: 'Trezor UI Components',
});