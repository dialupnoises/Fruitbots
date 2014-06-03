/*

SALESBOT 2.0!

Nearest fruit that's farthest from the opponent, basically.

*/

var target;

function new_game() {
}

function make_move() {
    if (get_board()[get_my_x()][get_my_y()])
        return TAKE;

    if(!target || (target.x == get_my_x() && target.y == get_my_y()))
        target = get_best_target();

    if(target.x < get_my_x())
        return WEST;
    if(target.x > get_my_x())
        return EAST;
    if(target.y < get_my_y())
        return NORTH;
    if(target.y > get_my_y())
        return SOUTH;

    return PASS;
}

function get_best_target()
{
    var my_fruit = get_closest_fruit(get_board(), get_my_x(), get_my_y());
    var op_fruit = get_closest_fruit(get_board(), get_opponent_x(), get_opponent_y());

    // score it based on difference
    var scores = [];
    my_fruit.forEach(function(f) {
        scores[f.x] = scores[f.x] || [];
        scores[f.x][f.y] = f.distance;
    });

    // penalize or reward each fruit by the distance that the opponent is from it
    op_fruit.forEach(function(f) {
        scores[f.x][f.y] += scores[f.x][f.y] - f.distance;
    });

    var final_scores = [];
    scores.forEach(function(sx, x) {
        sx.forEach(function(sy, y) {
            final_scores.push({x: x, y: y, score: sy});
        });
    });
    final_scores.sort(function(a, b) { return a.score - b.score; });

    return final_scores[0];
}

// returns the fruit ordered from closest to farthest
function get_closest_fruit(board, x, y)
{
    // get a list of all fruit on the board
    var fruit = [];
    for(var i=0;i<board.length;i++)
        for(var j=0;j<board[i].length;j++)
            if(board[i][j] > 0)
            {
                var distance = Math.sqrt(
                        Math.pow((i - x), 2) +
                        Math.pow((j - y), 2)
                    );
                fruit.push({x: i, y: j, distance: distance});
            }
    // sort by distance
    fruit.sort(function(a, b) { return a.distance - b.distance; });
    return fruit;
}

function default_board_number() {
     return 123;
}
