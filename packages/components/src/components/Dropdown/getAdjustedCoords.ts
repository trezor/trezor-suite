import { MenuAlignment } from './Menu';

export type Coords = { x: number; y: number };
export type Dimensions = { width: number; height: number };

export const getAdjustedCoords = (
    coords: Coords,
    alignMenu: MenuAlignment,
    menuDimentions: Dimensions,
    toggleDimentions?: Dimensions,
): Coords | undefined => {
    if (!coords) {
        return;
    }

    let { x, y } = coords;
    const { width, height } = menuDimentions;
    const OFFSET = 4;

    switch (alignMenu) {
        case 'top-right':
            x -= width;
            y -= height;
            if (toggleDimentions) {
                x += toggleDimentions.width + OFFSET;
                y -= OFFSET;
            }
            break;
        case 'top-left':
            y -= height;

            if (toggleDimentions) {
                x -= OFFSET;
                y -= OFFSET;
            }
            break;
        case 'right':
            x -= width;
            if (toggleDimentions) {
                x += toggleDimentions.width + OFFSET;
                y += toggleDimentions.height + OFFSET;
            }
            break;
        case 'left':
        default:
            if (toggleDimentions) {
                x -= OFFSET;
                y += toggleDimentions.height + OFFSET;
            }
    }

    return { x, y };
};
