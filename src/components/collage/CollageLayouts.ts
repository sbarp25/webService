export interface CollageSlot {
    id: string
    x: number // %
    y: number // %
    w: number // %
    h: number // %
}

export interface CollageLayout {
    id: string
    label: string
    slots: CollageSlot[]
}

export const COLLAGE_LAYOUTS: CollageLayout[] = [
    {
        id: 'grid-2x2',
        label: 'Grid 2x2',
        slots: [
            { id: '1', x: 0, y: 0, w: 50, h: 50 },
            { id: '2', x: 50, y: 0, w: 50, h: 50 },
            { id: '3', x: 0, y: 50, w: 50, h: 50 },
            { id: '4', x: 50, y: 50, w: 50, h: 50 },
        ]
    },
    {
        id: 'grid-1x2',
        label: 'Split Vertical',
        slots: [
            { id: '1', x: 0, y: 0, w: 50, h: 100 },
            { id: '2', x: 50, y: 0, w: 50, h: 100 },
        ]
    },
    {
        id: 'grid-2x1',
        label: 'Split Horizontal',
        slots: [
            { id: '1', x: 0, y: 0, w: 100, h: 50 },
            { id: '2', x: 0, y: 50, w: 100, h: 50 },
        ]
    },
    {
        id: 'grid-3-col',
        label: 'Three Columns',
        slots: [
            { id: '1', x: 0, y: 0, w: 33.33, h: 100 },
            { id: '2', x: 33.33, y: 0, w: 33.33, h: 100 },
            { id: '3', x: 66.66, y: 0, w: 33.34, h: 100 },
        ]
    },
    {
        id: 'grid-1-2',
        label: 'One Left, Two Right',
        slots: [
            { id: '1', x: 0, y: 0, w: 50, h: 100 },
            { id: '2', x: 50, y: 0, w: 50, h: 50 },
            { id: '3', x: 50, y: 50, w: 50, h: 50 },
        ]
    }
]

export const ASPECT_RATIOS = [
    { id: '1:1', label: 'Square (1:1)', w: 1080, h: 1080 },
    { id: '9:16', label: 'Story (9:16)', w: 1080, h: 1920 },
    { id: '4:5', label: 'Portrait (4:5)', w: 1080, h: 1350 },
    { id: '16:9', label: 'Landscape (16:9)', w: 1920, h: 1080 },
]
