import {
    Button,
    type ButtonProps,
    Host,
    RNHostView,
    ContextMenu as SwiftUIContextMenu,
} from '@expo/ui/swift-ui';

import type { ContextMenuIcon, ContextMenuProps } from './ContextMenu.types';

const systemImageByIcon = {
    share: 'square.and.arrow.up',
    download: 'square.and.arrow.down',
    qrCode: 'qrcode',
    copy: 'doc.on.doc',
} as const satisfies Record<ContextMenuIcon, ButtonProps['systemImage']>;

export const ContextMenu = ({ actions, children, style }: ContextMenuProps) => (
    <Host matchContents style={style}>
        <SwiftUIContextMenu>
            <SwiftUIContextMenu.Items>
                {actions.map(({ label, icon, onPress }) => (
                    <Button
                        key={label}
                        label={label}
                        systemImage={icon ? systemImageByIcon[icon] : undefined}
                        onPress={() => void onPress()}
                    />
                ))}
            </SwiftUIContextMenu.Items>
            <SwiftUIContextMenu.Trigger>
                <RNHostView matchContents boundedByHost>
                    {children}
                </RNHostView>
            </SwiftUIContextMenu.Trigger>
        </SwiftUIContextMenu>
    </Host>
);
