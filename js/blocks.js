const BLOCKS =
{
    I:
    [
        [[0,0], [1,0], [2,0], [3,0]],
        [[0,0], [0,1], [0,2], [0,3]],
        [[0,0], [1,0], [2,0], [3,0]],
        [[0,0], [0,1], [0,2], [0,3]],
    ],

    O:
    [
        [[0,0], [1,0], [0,1], [1,1]],
        [[0,0], [1,0], [0,1], [1,1]],
        [[0,0], [1,0], [0,1], [1,1]],
        [[0,0], [1,0], [0,1], [1,1]],
    ],

    T:
    [
        [[1,0], [0,1], [1,1], [2,1]],
        [[1,0], [1,1], [2,1], [1,2]],
        [[0,1], [1,1], [2,1], [1,2]],
        [[1,0], [0,1], [1,1], [1,2]],
    ],

    S:
    [
        [[1,0], [2,0], [0,1], [1,1]],
        [[0,0], [0,1], [1,1], [1,2]],
        [[1,0], [2,0], [0,1], [1,1]],
        [[0,0], [0,1], [1,1], [1,2]],
    ],

    Z:
    [
        [[0,0], [1,0], [1,1], [2,1]],
        [[1,0], [0,1], [1,1], [0,2]],
        [[0,0], [1,0], [1,1], [2,1]],
        [[1,0], [0,1], [1,1], [0,2]],
    ],

    J:
    [
        [[0,0], [0,1], [1,1], [2,1]],
        [[0,0], [1,0], [0,1], [0,2]],
        [[0,0], [1,0], [2,0], [2,1]],
        [[1,0], [1,1], [0,2], [1,2]],
    ],

    L:
    [
        [[2,0], [0,1], [1,1], [2,1]],
        [[0,0], [0,1], [0,2], [1,2]],
        [[0,0], [1,0], [2,0], [0,1]],
        [[0,0], [1,0], [1,1], [1,2]],
    ],
}

export default BLOCKS;
