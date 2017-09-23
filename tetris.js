(function() { 
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    context.scale(20, 20);

    const arena = createMatrix(12, 20);

    // creates a blank matrix (array of array's)
    function createMatrix(w, h) {
        const matrix = [];

        while (h--) {
            matrix.push(new Array(w).fill(0));
        }

        return matrix;
    }

    // detects if one of multiple rows are filled
    // if so, the filled rows are cleared
    function arenaSweep() {
        // lambda to detect if one row is filled
        let sweepRow = (row) => {
            for(let x = 0; x < row.length; ++x) {
                if (row[x] == 0) return false;
            }
            return true;
        };

        // check each row
        let rowCount = 1;
        for(let y = arena.length -1; y > 0; --y) {
            if (sweepRow(arena[y])) {
                const row = arena.splice(y, 1)[0].fill(0);
                arena.unshift(row);
                ++y;

                player.score += rowCount * 10;
                rowCount *= 2;
            }
        }
    }

    // check if the arena and player collide
    function collide(arena, player) {
        const [m, o] = [player.matrix, player.pos];
        for(let y = 0; y < m.length; ++y) {
            for(let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] &&
                    arena[y + o.y][x + o.x]) !== 0) 
                        return true;
            }
        }

        return false;
    }

    // creates a random piece
    function createPiece(type) {
        if (type === 'T'){
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ];
        }
        else if (type === 'O') {
            return [
                [2, 2],
                [2, 2],
            ];
        }
        else if (type === 'L') {
            return [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3],
            ];
        }
        else if (type === 'J') {
            return [
                [0, 4, 0],
                [0, 4, 0],
                [4, 4, 0],
            ];
        }
        else if (type === 'I') {
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
            ];
        }
        else if (type === 'S') {
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        }
        else if (type === 'Z') {
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ];
        }
    }

    // draws the tetris arena and player piece
    function draw() {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        drawMatrix(arena, { x: 0, y: 0});
        drawMatrix(player.matrix, player.pos);
    }

    // draws the matrix with an offset on the canvas
    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = colors[value];
                    context.fillRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    // merges the player piece with the arena
    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
    }

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(arena, player)) {
            player.pos.x -= dir;
        }
    }

    let nextPiece = null;
    function playerReset() {
        const pieces = 'ILJOTSZ';

        // fetch next piece, create one if null
        let thisPiece = nextPiece;
        if (thisPiece == null) {
            thisPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
        }
        player.matrix = thisPiece;
        
        // create new piece
        nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);

        // set player piece on top, centered
        player.pos.y = 0;
        player.pos.x = (arena[0].length / 2 | 0) -
            (player.matrix[0].length / 2 | 0);

        // if we have a collision between player and arena
        // then: game over man. game over.
        if (collide(arena, player)) {
            arena.forEach(row => row.fill(0));
            player.score = 0;
            updateScore();
        }
    }

    function playerRotate(dir){
        const pos = player.pos.x;

        // rotate the player piece, but correct the player position 
        // if the player collides with arena after the rotation
        let offset = 1;
        rotate(player.matrix, dir);
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }

    // rotates the matrix in a clockwise (1) of anti-clockwise direction (-1)
    function rotate(matrix, dir) {
        if (dir !== 1 && dir !== -1)
            return;

        for(let y = 0; y < matrix.length; ++y) {
            for(let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x]
                ] = [
                    matrix[y][x],
                    matrix[x][y]
                ]
            }
        }

        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        }
        else {
            matrix.reverse();
        }
    }

    let dropCounter = 0;
    let dropInterval = 1000;

    let lastTime = 0;
    function update(time = 0) {
        const deltaTime = time - lastTime;
        lastTime = time;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval){
            playerDrop();
        }

        draw();
        requestAnimationFrame(update);
    }

    function updateScore() {
        document.getElementById('score').innerText = 'Score: ' + player.score;
    }

    const player = {
        pos: { x: 0, y: 0},
        matrix: null,
        score: 0
    };

    const colors = [
        null,
        '#FF0D72',
        '#0DC2FF',
        '#0DFF72',
        '#F538FF',
        '#FF8E0D', 
        '#FFE138',
        '#3877FF'
    ];

    function initKeyboardEvents() {
        document.addEventListener('keydown', event => {
            switch(event.keyCode)
            {
                case 37: 
                {
                    playerMove(-1);
                    break;
                }
                case 39:
                {
                    playerMove(1);
                    break;
                }
                case 40: 
                {
                    playerDrop();
                    break;
                }
                case 81:
                {
                    playerRotate(-1);
                    break;
                }
                case 38:
                case 87:
                {
                    playerRotate(1);
                    break;
                }

                case 32:
                {
                    playerReset();
                    break;
                }
            }
        });
    }

    function initTetris() {
        initKeyboardEvents();
        playerReset();
        updateScore();
        update();
    }

    initTetris();
})();

