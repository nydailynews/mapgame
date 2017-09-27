INSERT INTO count (mapgame_games, mapgame_guesses) SELECT COUNT(*), SUM(guesses) FROM mapgame_games;
