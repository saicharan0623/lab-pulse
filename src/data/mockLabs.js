export const mockLabs = {
    // Lab 1,2,3: Sequential numbering 1-32
    lab123: {
        id: 'lab123',
        name: 'LAB 1, 2, 3',
        leftColumn: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, status: i === 2 ? 'occupied' : 'empty' })),
        middleLeft: Array.from({ length: 8 }, (_, i) => ({ id: i + 9, status: 'empty' })),
        middleRight: Array.from({ length: 8 }, (_, i) => ({ id: i + 17, status: i === 5 ? 'submitted' : 'empty' })),
        rightColumn: Array.from({ length: 8 }, (_, i) => ({ id: i + 25, status: 'empty' })),
    },

    // Lab 4,5,6: 6 columns, sequential numbering 1-48
    lab456: {
        id: 'lab456',
        name: 'LAB 4, 5, 6',
        col1: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, status: 'empty' })),
        col2: Array.from({ length: 8 }, (_, i) => ({ id: i + 9, status: i === 3 ? 'occupied' : 'empty' })),
        col3: Array.from({ length: 8 }, (_, i) => ({ id: i + 17, status: 'empty' })),
        col4: Array.from({ length: 8 }, (_, i) => ({ id: i + 25, status: 'empty' })),
        col5: Array.from({ length: 8 }, (_, i) => ({ id: i + 33, status: i === 1 ? 'submitted' : 'empty' })),
        col6: Array.from({ length: 8 }, (_, i) => ({ id: i + 41, status: 'empty' })),
    },

    // HPC: 3 columns, 5 rows, 2 PCs per row = 30 total
    hpc: {
        id: 'hpc',
        name: 'HPC LAB',
        columns: [
            Array.from({ length: 5 }, (_, row) => [
                { id: row * 2 + 1, status: row === 0 ? 'occupied' : 'empty' },
                { id: row * 2 + 2, status: 'empty' }
            ]),
            Array.from({ length: 5 }, (_, row) => [
                { id: row * 2 + 11, status: 'empty' },
                { id: row * 2 + 12, status: row === 2 ? 'submitted' : 'empty' }
            ]),
            Array.from({ length: 5 }, (_, row) => [
                { id: row * 2 + 21, status: 'empty' },
                { id: row * 2 + 22, status: 'empty' }
            ]),
        ]
    }
};
