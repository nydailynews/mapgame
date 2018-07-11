# Map Game
Make a "Where Is X (Country / City / Point of Interest) On The Map?" game.

# How-To's

## How to create a map game
1. Figure out the place you want to guess.
1. Create the KML file(s) for the place, add them to repo.
  1. Copy the [www/kml/blank.kml](www/kml/blank.kml) file to one named after the location you're making the map game for.
  1. Figure out the boundaries you're putting in the KML.
    1. If you're creating a map game for a particular country, you can find the country's boundaries in the [www/kml/world.kml](www/kml/world.kml) file.
1. Create the database record for the place -- [www/admin/newgame.bash](www/admin/newgame.bash) streamlines this process, and should be run from the command line of the server you're running this on. *If you're running the query by hand, use [www/admin/new-game.sql](www/admin/new-game.sql) as the basis for your query*.
1. Create the markup for the particular mapgame. [Here's one example of this](www/games/map-find-boundary.html)
  1. Search and replace out these fields:
    1. LOCATION with the location you're map-gaming, such as "Thailand."
    1. SLUG with the lowercase slug of the map game. This is probably the same name as the directory you created for the map game, such as "thailand."
    1. MAPOF with what the region you'll be shown in the map, such as "south east Asia."
  1. Figure out where you want the map to be centered, and update the lat/long on the line that has `centerlatlng` on it with that lat/long.
  1. Figure out where you want the map marker to start, and update the lat/long on the line that has `markerlatlng` on it with that lat/long.
  1. Write an intro for the map game.
1. Make sure the map still works on handheld views. Sometimes you'll need to adjust the zoom, when you do that, change the line that reads `zoom: 5,` to something like `zoom: TO COME,`
1. 

## How to get started with a dev environment
1. Check out this repo. `git clone git@github.com:nydailynews/where-in-the-world.git`
1. Symlink the repo's www directory into an active webserver on your computer.
1. To start on testing the backend, take a look at the sql in www/admin/tables.sql

# License

The MIT License (MIT)

Copyright © 2015-2017 The Denver Post

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
