import { Button, Host, RNHostView, ContextMenu as SwiftUIContextMenu } from '@expo/ui/swift-ui';

import type { ContextMenuProps } from './ContextMenu.types';

export const ContextMenu = ({ actions, children, style }: ContextMenuProps) => (
    <Host matchContents style={style}>
        <SwiftUIContextMenu>
            <SwiftUIContextMenu.Items>
                {actions.map(({ label, systemImage, onPress }) => (
                    <Button
                        key={label}
                        label={label}
                        systemImage={systemImage}
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
