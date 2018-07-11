INSERT INTO mapgame_count (games, guesses) SELECT COUNT(*), SUM(guesses) FROM mapgame_games;
