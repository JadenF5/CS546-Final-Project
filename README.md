**CS 546 Web Programming I Final Project: Video Game Forum**


**Group Members**

* Ryan Raymundo
* Jaden Fernandes
* Harishan Amirthanathan
* Michael Hanna

A fan community hub for multiplayer games including Marvel Rivals, Overwatch 2, Valorant, League of Legends, and Teamfight Tactics. Users can track personal gaming preferences, connect with friends, and participate in character-focused discussions for their favorite games.

Built using HTML, CSS, JavaScript, Express, Node.js, MongoDB, and Handlebars.

**How to Setup**
First, run `npm install` to install the necessary dependencies for this project.

Then, run `npm run seed` to seed the database with initial game data, sample users, and sample posts.

Finally, run `npm start` to start the application and navigate to `http://localhost:3000` in your browser.

**Core Features**

* Main Page
  * Personalized Dashboard that shows the user's selected games
  * Under the games it shows the top forum threads, new posts of your favorite heroes
  * When you click the game it has the threads for all the heroes and characters per game
  * Further down the page if friends with another user it shows their profile
  * At the bottom it has the rest of the games that are not in the users preferences

* User Accounts & Profiles
  * Users will be able to sign up/log in with email + password
  * When they sign up, they can choose their favorite games and select heroes/characters
  * On their profile, users can see chosen games and favorite heroes with character images
  * Bio, gaming platforms, and user's posts are displayed
  * Edit functionality to allow the user to change hero list, games, bio, gaming platforms

* Game Pages
  * Each game has its own page with overview (genre, platform, etc)
  * List of all the playable heroes/characters
  * Mini-forums (threads) when you click on each hero
  * Users can post questions, clips, memes, strategies
  * User can sort it by latest, most liked, or pinned

* Mini Forums for Heroes/Characters
  * Every hero/character has its own set of forum threads
  * Users can create posts (text, images, video uploads) and add tags
  * Like, comment, and replying system on each post

* Profile Privacy & Customization
  * Users can make their profile completely private
  * Extra visibility settings for their hero/character list, posts, and bio

* Friend System
  * Add or remove friends with a button
  * Friends' profiles appear on the dashboard

* Notifications
  * Alerts for new comments or likes on users' posts
  * Friend requests or friend activity
  * Forum posts of the users' preferred characters

* User Badges & Achievements
  * Earn badges for posting, getting likes, or being active
  * Badges displayed on user profile

* Admin Tools
  * Moderate forum content
  * Pin important threads
  * Manage games in the database

* Advanced Search Bar
  * Filter posts by game, hero, or post type
  * Search for users

* Looking for Teammates
  * Find other players to play with by making posts
  * Specify game and other details to connect with other players

**API Integrations**

This application integrates with several gaming APIs:
* Riot Games API (League of Legends, Teamfight Tactics, Valorant)
* Marvel Rivals API
* Overwatch 2 API (via OverFast)

API keys are managed in the `services/gameApi.js` file.

**GitHub Link**

* https://github.com/JadenF5/CS546-Final-Project
