/*

SALESBOT 1.1!

Uses a genetic algorithm to find the best route. 
Partially improved by scoring with with its wasted moves (when it moves to a square it already visited),
and increased mutation rate.

*/

var list_moves = null;
var next_move = 0;

function new_game() {
}

function make_move() {
    if(list_moves == null)
        list_moves = getShortestRoute(get_board(), get_my_x(), get_my_y());
    if(get_board()[get_my_x()][get_my_y()] > 0)
        return TAKE;
    return list_moves[next_move++] || PASS;
}


// Optionally include this function if you'd like to always reset to a 
// certain board number/layout. This is useful for repeatedly testing your
// bot(s) against known positions.
//
function default_board_number() {
    return 123;
}

function getShortestRoute(board, x, y)
{
    var time = Date.now();
    var best_move, best_move_score = null;
    var offspring = Array(20);
    var original_x = x;
    var original_y = y;
    var max_moves = board[0].length * board.length + 20; // h * w + 20
    var move_options = [NORTH,SOUTH,EAST,WEST];
    for(var i=0;i<20;i++)
    {
        offspring[i] = [];
        for(var j=0;j<max_moves;j++)
            offspring[i].push(move_options[Math.floor(Math.random() * 4)]);
    }
    while(time + (90 * 60) > Date.now())
    {
        x = original_x;
        y = original_y;
        var scoring = [];
        var total_score = 0;
        for(var i=0;i<20;i++) // simulate offspring
        {
            var fruits = [];
            var visited = Array(board.length);
            var wasted_moves = 0;
            // move and pick up fruit
            offspring[i].forEach(function(move) {
                if(move == NORTH && y > 0) y--;
                if(move == SOUTH && y < board[0].length - 1) y++;
                if(move == WEST && x > 0) x--;
                if(move == EAST && x < board.length - 1) x++;
                if(visited[x] && visited[x][y])
                    wasted_moves++;
                else
                {
                    visited[x] = visited[x] || [];
                    visited[x][y] = true;
                }
                if(board[x][y] > 0)
                    fruits[board[x][y]] = fruits[board[x][y]]++ || 1;
            });
            var score = 0;
            fruits.forEach(function(amount, fruit) {
                score += amount / get_total_item_count(fruit);
            });
            score -= wasted_moves / max_moves;
            scoring[i] = Math.max(0.001, score);
            total_score += Math.max(0.001, score);
        }
        for(var i=0;i<scoring.length;i++)
            if(scoring[i] > best_move_score || best_move_score == null)
            {
                best_move = offspring[i];
                best_move_score = scoring[i];
            }
        var new_offspring = Array(20);
        for(var i=0;i<20;i+=2)
        {
            var offspring1 = roulette(total_score, scoring, offspring);
            var offspring2 = roulette(total_score, scoring, offspring);

            if(Math.random() < 0.7) // crossover
            {
                var crossoverPoint = Math.floor(Math.random() * offspring1.length);
                if(crossoverPoint == 0) crossoverPoint = 1;
                var oldOffspring1 = offspring1;
                offspring1 = offspring1.slice(0, crossoverPoint).concat(offspring2.slice(crossoverPoint));
                offspring2 = offspring2.slice(0, crossoverPoint).concat(oldOffspring1.slice(crossoverPoint));
            }

            offspring1 = mutate(offspring1);
            offspring2 = mutate(offspring2);

            new_offspring[i] = offspring1;
            new_offspring[i + 1] = offspring2;
        }
        offspring = new_offspring;
    }
    trace('Done in ' + ((Date.now() - time) / 1000) + ' seconds');
    trace('Result score: ' + best_move_score);
    return best_move;
}

function roulette(total_fitness, scoring, offspring)
{
    var slice = Math.random() * total_fitness;
    var fitness = 0;
    for(var i=0;i<scoring.length;i++)
    {
        fitness += scoring[i];
        if(fitness >= slice)
            return offspring[i];
    }
}

function mutate(offspring)
{
    if(Math.random() < 0.01)
        return offspring.reverse();
    return offspring;
}