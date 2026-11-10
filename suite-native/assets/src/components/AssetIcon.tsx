import { type ComponentProps } from 'react';

import { TokenIcon } from '@suite-native/tokens';

type AssetIconProps = ComponentProps<typeof TokenIcon>;

/** The icon of a network's coin, or of a token with its placeholder resolved from metadata. */
export const AssetIcon = (props: AssetIconProps) => <TokenIcon {...props} />;
