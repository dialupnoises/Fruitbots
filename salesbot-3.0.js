/*

SALESBOT 3.0

Genetic algorithm to determine the next fruit to pick. Moderately OK.
*/

var targets;
var next_target = 0;

function new_game() {
}

function make_move() {
    if(get_board()[get_my_x()][get_my_y()]){
		var item = get_board()[get_my_x()][get_my_y()];
		var plyAmount = get_my_item_count(item)
		var oppAmount = get_opponent_item_count(item)
		if( get_total_item_count(item) % 2 == 0 ){
			var evenHalf = (get_total_item_count(item) / 2) + 1;
			if(plyAmount < evenHalf || oppAmount < evenHalf ) { return TAKE; }
		} else {
			var oddHalf = Math.ceil(get_total_item_count(item) / 2);
			if(plyAmount < oddHalf || oppAmount < oddHalf ) { return TAKE; }
		}
	}
	
    if(!targets)
        targets = find_best_target();
    var target = targets[next_target];
    if(target.x == get_my_x() && target.y == get_my_y() || get_board()[target.x][target.y] == 0)
        target = targets[++next_target];

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

function find_best_target()
{
    var time = Date.now();
    var fruits = get_all_fruits();
    var types = get_all_fruit_types();
    var organisms = [];
    for(var i=0;i<20;i++)
        organisms[i] = shuffle(fruits.slice(0)); // clone the fruits array and shuffle it
    var best_organism = {};
    while(time + 90 * 60 > Date.now())
    {
        var scores = [];
        var total_score = 0;
        organisms.forEach(function(organism) {
            var score = score_organism(organism, types);
            total_score += score;
            scores.push({
                score: score, 
                genome: organism
            });
            if(!best_organism.score || score > best_organism.score)
                best_organism = {
                    score: score,
                    genome: organism
                };
        });
        // reproduction is fun!
        var new_organisms = [];
        for(var i=0;i<scores.length;i++)
        {
            var parent1 = select_organism(scores, total_score);
            var parent2 = select_organism(scores, total_score);
            new_organisms.push(crossover_organisms(parent1, parent2));
        }
        organisms = new_organisms;
    }
    trace('find_best_path() completed in ' + ((Date.now() - time) / 1000) + ' seconds.');
    trace('score is ' + best_organism.score);
    return best_organism.genome;
}

const RANDOM_CROSSOVER = false; // config!
function crossover_organisms(parent1, parent2)
{
    var offspring = [];
    if(RANDOM_CROSSOVER)
    {
        for(var i=0;i<parent1.length;i++)
            if(Math.random() >= 0.5)
                offspring[i] = parent1[i];
            else
                offspring[i] = parent2[i];
    }
    else // good ol' single point crossover
    {
        var point = Math.floor(Math.random() * parent1.length);
        offspring = parent1.slice(0, point);
        offspring.concat(parent2.slice(point));
    }
    return offspring;
}

// fitness proportionate selection aka roulette wheel
function select_organism(organisms, total_score)
{
    var slice = Math.random() * total_score;
    var fitness = 0;
    for(var i=0;i<organisms.length;i++)
    {
        fitness += organisms[i].score;
        if(fitness >= slice)
            return organisms[i].genome;
    }
}

function score_organism(organism, types)
{
    var board = get_board();
    var opponentX = get_opponent_x();
    var opponentY = get_opponent_y();
    var op_taken = [];
    var opponent_moves = get_closest_fruits(opponentX, opponentY);
    var next_op_target = 0;
    var opponent_target = opponent_moves[next_op_target++];
    var organismX = get_my_x();
    var organismY = get_my_y();
    var score = 0;
    var collected = {};
    organism.forEach(function(position) {
        if(op_taken[position.x] && op_taken[position.x][position.y])
            return; // already taken, go to the next one
        while(true)
        {
            if(organismX > position.x)
                organismX--;
            else if(organismX < position.x)
                organismX++;
            else if(organismY > position.y)
                organismY--;
            else if(organismY < position.y)
                organismY++;
            // move the opponent
            if(opponent_target.x > opponentX)
                opponentX--;
            else if(opponent_target.x < opponentX)
                opponentX++;
            else if(opponent_target.y > opponentY)
                opponentY++;
            else if(opponent_target.y < opponentY)
                opponentY--;
            else if(opponent_target.x == opponentX && opponent_target.y == opponentY)
            {
                op_taken[opponent_target.x] = op_taken[opponent_target.x] || [];
                op_taken[opponent_target.x][opponent_target.y] = true;
                opponent_target = opponent_moves[next_op_target++];
            }
            if(organismX == position.x && organismY == position.y)
            {
                var type = board[position.x][position.y];
                // first, give it a score based on fruit value
                // the more of the type we collect, the less score we get
                score += 5 - (5 * ((collected[type] || 0) / types[type]));
                // penalize it for the amount of moves it took (at most -3 points)
                score -= Math.min(get_distance(position.x, position.y, organismX, organismY), 3);
                // increment the collected counter
                collected[type] = collected[type] + 1 || 1;
                break;
            }
        }
    });
    return score;
}

// get closest fruits
function get_closest_fruits(x, y)
{
    var fruits = get_all_fruits();
    var closest, closest_distance;
    var distances = [];
    fruits.forEach(function(fruit) {
        var distance = get_distance(fruit.x, fruit.y, x, y);
        distances.push({x: fruit.x, y: fruit.y, distance: distance});
    });
    distances.sort(function(a,b) { return a.distance-b.distance; });
    return distances;
}

// super complex euclidean distance algorithm
function get_distance(x1, y1, x2, y2)
{
    return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
}

function get_all_fruit_types()
{
    var fruits = get_all_fruits();
    var counts = {};
    var board = get_board();
    fruits.map(function(e) {
        var type = board[e.x][e.y];
        if(!counts[type]) counts[type] = get_total_item_count(type);
    });
    return counts;
}

function get_all_fruits()
{
    var board = get_board();
    var fruits = [];
    for(var i=0;i<board.length;i++)
        for(var j=0;j<board[i].length;j++)
            if(board[i][j] > 0)
                fruits.push({x: i, y: j});
    return fruits;
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o) { //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function default_board_number() {
    return 123;
}
