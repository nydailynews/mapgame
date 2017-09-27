#!/bin/bash
# Create a new mapgame record
# Usage:
# ./newgame this-is-the-slug "This Is The Title"

SQL="INSERT INTO mapgame_games (slug, title, guess_average, guesses, correct) VALUES ('$1', '$2', 0.0, 0, 0);"
echo $SQL > newgame.sql 
mysql $DBNAME -u root -p < newgame.sql
