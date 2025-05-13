import { users, posts, games, notifications, teammatePosts } from "./config/mongoCollections.js";
import { dbConnection, closeConnection } from "./config/mongoConnection.js";
import bcrypt from "bcryptjs";

import gameData from "./data/game.js";

async function seedUsers() {
    const userCollection = await users();

    await userCollection.deleteMany({});

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("Password123!", saltRounds);

    const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString();

    // Sample users
    const userDocs = [
    {
      email: "admin@example.com",
      hashedPassword,
      username: "TheAdmin",
      role: "admin",
      bio: "Administrator account for the GameForum platform",
      platforms: ["PC", "Xbox"],
      selectedGames: ["League of Legends", "Valorant"],
      favoriteCharacters: {
        "League of Legends": ["Garen"],
        Valorant: ["Jett"]
      },
      friends: [],      // will fill in below
      privacySettings: {
        profilePublic:    true,
        showPosts:        true,
        showCharacters:   true,
        showBio:          true,
        showAchievements: true
      },
      achievements: [
        { name: "First Sign Up!", earnedOn: new Date().toISOString().split("T")[0], },
        { name: "First Post!", earnedOn: new Date().toISOString().split("T")[0], },
      ],
      createdAt: new Date().toISOString()
    },
    {
      email: "oldgamer@example.com",
      hashedPassword,
      username: "vintagePlayer",
      role: "user",
      bio: "I've been here a while…",
      platforms: ["PC"],
      selectedGames: ["League of Legends", "Marvel Rivals"],
      favoriteCharacters: {
        "League of Legends": ["Lux"],
        "Marvel Rivals":    ["Iron Man"]
      },
      friends: [],
      privacySettings: {
        profilePublic:    true,
        showPosts:        true,
        showCharacters:   true,
        showBio:          true,
        showAchievements: true
      },
      achievements: [
        { name: "First Sign Up!", earnedOn: new Date().toISOString() }
      ],
      // backdate this account 30 days
      createdAt: thirtyDaysAgo
    },
    {
      email: "newbie@example.com",
      hashedPassword,
      username: "freshGamer",
      role: "user",
      bio: "Just getting started.",
      platforms: ["PlayStation"],
      selectedGames: ["Valorant", "Overwatch 2"],
      favoriteCharacters: {
        "Valorant":      ["Sage"],
        "Overwatch 2": ["Tracer"]
      },
      friends: [],
      privacySettings: {
        profilePublic:    true,
        showPosts:        true,
        showCharacters:   true,
        showBio:          true,
        showAchievements: true
      },
      achievements: [
        { name: "First Sign Up!", earnedOn: new Date().toISOString().split("T")[0], },
        { name: "First Post!", earnedOn: new Date().toISOString().split("T")[0], },
      ],
      createdAt: new Date().toISOString()
    },
    {
      email: "pro@example.com",
      hashedPassword,
      username: "powerPoster",
      role: "user",
      bio: "I post a lot.",
      platforms: ["PC","Mobile"],
      selectedGames: ["Teamfight Tactics","Marvel Rivals"],
      favoriteCharacters: {
        "Teamfight Tactics": ["spider-man"],
        "Marvel Rivals":     ["doctor strange"]
      },
      friends: [],
      privacySettings: {
        profilePublic:    true,
        showPosts:        true,
        showCharacters:   true,
        showBio:          true,
        showAchievements: true
      },
      achievements: [
        { name: "First Sign Up!", earnedOn: new Date().toISOString().split("T")[0], },
        { name: "First Post!", earnedOn: new Date().toISOString().split("T")[0], },
      ],
      createdAt: new Date().toISOString()
    },
    {
        // one user with 49 likes for achivement testing
        email: "famous@example.com",
        hashedPassword,
        username: "superStar",
        role: "user",
        bio: "I am so close to being famous!",
        platforms: ["PC"],
        selectedGames: ["League of Legends"],
        favoriteCharacters: { "League of Legends": ["Lux"] },
        friends: [],
        privacySettings: {
            profilePublic:    true,
            showPosts:        true,
            showCharacters:   true,
            showBio:          true,
            showAchievements: true
        },
        achievements: [
            { name: "First Sign Up!", earnedOn: new Date().toISOString().split("T")[0], },
            { name: "First Post!", earnedOn: new Date().toISOString().split("T")[0], },
        ],
        createdAt: new Date().toISOString()
    }
  ];

  // insert them all at once
  const { insertedIds } = await userCollection.insertMany(userDocs);
  console.log("Seeded users:", insertedIds);

  // wire up friendships
  // TheAdmin ↔ vintagePlayer
  await userCollection.updateOne(
    { _id: insertedIds[0] },
    { $set: { friends: [insertedIds[1].toString()] } }
  );
  await userCollection.updateOne(
    { _id: insertedIds[1] },
    { $set: { friends: [insertedIds[0].toString(), insertedIds[2].toString()] } }
  );
  // vintagePlayer ↔ freshGamer already above, now freshGamer ↔ powerPoster
  await userCollection.updateOne(
    { _id: insertedIds[2] },
    { $set: { friends: [insertedIds[1].toString(), insertedIds[3].toString()] } }
  );
  await userCollection.updateOne(
    { _id: insertedIds[3] },
    { $set: { friends: [insertedIds[2].toString()] } }
  );

  // finally fetch & return the array of user objects
  const seeded = await userCollection.find({}).toArray();
  return seeded;
}

async function seedPosts(usersList, gamesList) {
  const postsCollection = await posts();
  await postsCollection.deleteMany({});

  // build a quick map username → _id
  const userMap = {};
  for (const u of usersList) {
    userMap[u.username] = u._id.toString();
  }

  // the exact order of games and which characters to use
  const ORDERED_GAMES = [
    "League of Legends",
    "Valorant",
    "Marvel Rivals",
    "Overwatch 2",
    "Teamfight Tactics"
  ];

  const GAME_CHARACTERS = {
    "League of Legends": ["Garen", "Lux", "Ahri"],
    "Valorant":          ["Jett", "Sage", "Phoenix"],
    "Marvel Rivals":     ["iron Man", "doctor strange", "spider-man"],
    "Overwatch 2":       ["Tracer", "Mercy", "Reaper"],
    "Teamfight Tactics": ["Annie", "Yasuo", "Lulu"]
  };

  const POSTS_PER_GAME = 5;
  const postDocs = [];
  let hourOffset = 0;
  let powerCount = 0;

  for (const gameName of ORDERED_GAMES) {
    const chars = GAME_CHARACTERS[gameName] || [null];
    for (let i = 0; i < POSTS_PER_GAME; i++) {
      // pick character by its index (wrap if needed)
      const character = chars[i % chars.length] || "N/A";

      // assign poster: first 9 to powerPoster, then a fixed cycle
      let username;
      if (powerCount < 9) {
        username = "powerPoster";
        powerCount++;
      } else {
        // cycle through the others in a known order
        const OTHERS = ["vintagePlayer", "freshGamer", "TheAdmin"];
        username = OTHERS[i % OTHERS.length];
      }
      const userId = userMap[username];

      // likes follow a small formula
      const likes = ((i + hourOffset) * 7) % 30;

      const timestamp = new Date(
        Date.now() - hourOffset * 60 * 60 * 1000
      ).toISOString();
      hourOffset++;

      postDocs.push({
        userId,
        username,
        game:      gameName,
        character,
        title:     `${character} strategy guide #${i+1}`,
        body:      `Some tips on playing ${character} in ${gameName}.`,
        tags:      ["strategy", "guide"],
        media:     [],
        likes,
        comments:  [],
        timestamp
      });
    }
  }

  const adminId = userMap["TheAdmin"];
  postDocs.push({
    userId:   adminId,
    username: "TheAdmin",
    game:     "Overwatch 2",
    character:"Tracer",
    title:    "My 49-like Milestone Post",
    body:     "This is the single post that has exactly 49 likes!",
    tags:     ["milestone"],
    media:    [],
    likes:    49,
    pinned: true,
    comments: [],
    timestamp: new Date().toISOString()
  });

  await postsCollection.insertMany(postDocs);
  console.log(`Inserted ${postDocs.length} posts`);
}

// Execute the seed function
async function main() {
    const db = await dbConnection();
    try {
        console.log("Starting database seeding...");
        const gameCollection = await games();
        const notificationCollection = await notifications();
        const teammatePostsCollection = await teammatePosts();

        await gameCollection.deleteMany({});
        await notificationCollection.deleteMany({});
        await teammatePostsCollection.deleteMany({});

        console.log("Ensuring games are initialized...");
        const gamesList = await gameData.initializeGames();

        console.log("Seeding users...");
        const usersList = await seedUsers();

        console.log("Seeding posts...");
        await seedPosts(usersList, gamesList);

        console.log("All data seeded successfully!");
    } catch (e) {
        console.error("Error during seeding:", e);
    } finally {
        await closeConnection();
    }
}

main();
