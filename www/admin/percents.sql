SELECT title, 
  CONCAT(ROUND((correct/guesses)*100), '%')
    AS percent 
  FROM mapgame_games
  ORDER BY percent DESC;
