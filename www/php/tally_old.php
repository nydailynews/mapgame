<?php
/*
Handle form requests such as
*/
    header("Access-Control-Allow-Headers: X-Requested-With");
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST");
    header("Vary: Accept-Encoding");

// Because handling form requests is easier with PHP.
// Return the AJAX request


function error_out($slug)
{
    $error_url = 'http://interactive.nydailynews.com/error?';
    header('Location: ' . $error_url . $slug);
    die();
}

if ( !isset($_GET) ) error_out('nopost');

// Validate input.
// If we're taking input from a non-javascript enabled browser, we check that out here:
if ( !isset($_GET['distance']) ) error_out('no-distance');
$distance = intval($_GET['distance']);
if ( $distance < 0 ) header('Location: ' . $_SERVER['HTTP_REFERER'] . '?source=err_novote');


// Passed the security checks. Now we add the record to the database.
require_once ($SERVER_ROOT . 'includes/php/mysql_connect_staging.php');
$slug = htmlspecialchars($_GET['slug']);

// Get the game id
$sql = 'SELECT id, guesses, guess_average, wrong_guess_average, correct FROM mapgame_games WHERE slug = "' . $slug . '" LIMIT 1';
$result = @mysql_query($sql);
$game = mysql_fetch_array($result, MYSQL_ASSOC);
$games_id = intval($game['id']);
$correct = intval($game['correct']);
if ( $games_id == 0 ) die('Bad ID');

// See how many people they did worse than
$sql = 'SELECT COUNT(*) AS count FROM mapgame_guesses WHERE games_id = ' . $games_id . ' AND guess < ' . $distance;
$result = @mysql_query($sql);
$obj  = mysql_fetch_array($result, MYSQL_ASSOC);
$worse_than = intval($obj['count']);

// Insert the guess
if ( $distance != -1 ):
    $sql = 'INSERT INTO mapgame_guesses 
            (games_id, guess, lat, lon, ip) VALUES 
            (' . $games_id . ', ' . $distance . ', ' . floatval($_GET['lat']) . ',
            ' . floatval($_GET['lon']) . ', 
            "' . $_SERVER['REMOTE_ADDR'] . '")';
    $result = @mysql_query($sql);
endif;

// **** UPDATE THE GUESSES
$new_guesses = $game['guesses'] + 1;
if ( $distance == 0 ) $correct += 1;
$new_average = floatval(( ( $game['guesses'] * $game['guess_average'] ) + $distance ) / $new_guesses);

$new_wrong_average = $game['wrong_guess_average'];
if ( $distance > 0 ):
    $wrong = $new_guesses - $correct;
    if ( $wrong < 1 ) $wrong = 1;
    $new_wrong_average =  floatval(( ( ( $wrong - 1 ) * $game['wrong_guess_average'] ) + $distance ) / $wrong );
endif;

$sql = 'UPDATE mapgame_games SET correct = ' . $correct . ',
    guesses = ' . $new_guesses . ',
    guess_average = ' . $new_average . ',
    wrong_guess_average = ' . $new_wrong_average . '
    WHERE id = ' . $games_id . ' LIMIT 1';
$result = @mysql_query($sql);

// **** TELL THE READER HOW THEY DID.
echo '{ "correct": "' . $correct . '", "guesses": "' . $game['guesses'] . '", "average": "' . $game['guess_average'] . '", "worse_than": "' . $worse_than . '" }';
