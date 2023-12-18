import { MenuAlignment } from './Menu';

export type Coords = { x: number; y: number };
export type Dimensions = { width: number; height: number };

export const getAdjustedCoords = ({
    coords,
    alignMenu,
    menuDimensions,
    toggleDimensions,
    offsetX = 0,
    offsetY = 0,
}: {
    coords: Coords;
    alignMenu: MenuAlignment;
    menuDimensions: Dimensions;
    toggleDimensions?: Dimensions;
    offsetX?: number;
    offsetY?: number;
}): Coords | undefined => {
    if (!coords) {
        return;
    }

    let { x, y } = coords;
    const { width, height } = menuDimensions;
    const MENU_DEFAULT_OFFSET = 4;

    switch (alignMenu) {
        case 'top-right':
            x += offsetX;
            y = y + offsetY - height;

            if (toggleDimensions) {
                x -= MENU_DEFAULT_OFFSET;
                y -= MENU_DEFAULT_OFFSET;
            }
            break;
        case 'top-left':
            x = x + offsetX - width;
            y = y + offsetY - height;
            if (toggleDimensions) {
                x += toggleDimensions.width + MENU_DEFAULT_OFFSET;
                y -= MENU_DEFAULT_OFFSET;
            }
            break;
        case 'bottom-right':
            x = x + offsetX - width;
            y += offsetY;
            if (toggleDimensions) {
                x += toggleDimensions.width + MENU_DEFAULT_OFFSET;
                y += toggleDimensions.height + MENU_DEFAULT_OFFSET;
            }
            break;
        case 'right-top':
            x += offsetX;
            y += offsetY;
            if (toggleDimensions) {
                x += toggleDimensions.width + MENU_DEFAULT_OFFSET;
            }
            break;
        case 'right-bottom':
            x += offsetX;
            y = offsetY - height;
            if (toggleDimensions) {
                x += toggleDimensions.width + MENU_DEFAULT_OFFSET;
                y += toggleDimensions.height + MENU_DEFAULT_OFFSET;
            }
            break;
        case 'left-top':
            x = x + offsetX - width;
            y += offsetY;
            if (toggleDimensions) {
                x -= MENU_DEFAULT_OFFSET;
            }
            break;
        case 'left-bottom':
            x = x + offsetX - width;
            y = y + offsetY - height;
            if (toggleDimensions) {
                x -= MENU_DEFAULT_OFFSET;
                y += toggleDimensions.height + MENU_DEFAULT_OFFSET;
            }
            break;
        case 'bottom-left':
        default:
            x += offsetX;
            y += offsetY;
            if (toggleDimensions) {
                x -= MENU_DEFAULT_OFFSET;
                y += toggleDimensions.height + MENU_DEFAULT_OFFSET;
            }
    }

    return { x, y };
};
