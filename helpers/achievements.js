export async function awardAchievement(userId, name, usersCollection) {
    const user = await usersCollection.findOne({ _id: userId });
    if (!user) return;

    const alreadyHas = (user.achievements || []).some((a) => a.name === name);
    if (!alreadyHas) {
        const now = new Date();
        const Y = now.getFullYear();
        const M = String(now.getMonth() + 1).padStart(2, "0");
        const D = String(now.getDate()).padStart(2, "0");
        const localDate = `${Y}-${M}-${D}`;
        await usersCollection.updateOne(
            { _id: userId },
            {
                $push: {
                    achievements: {
                        name,
                        earnedOn: localDate,
                    },
                },
            }
        );
    }
}

export const achievementCatalog = [
    { name: "First Sign Up!", emoji: "❤️", description: "You registered your account." },
    { name: "First Post!", emoji: "💬", description: "You made your first post." },
    { name: "Clip Professional", emoji: "🎬", description: "Posted 10 threads." },
    { name: "Famous", emoji: "🌟", description: "Received 50 likes on a post or across posts." },
    { name: "Loyal Member", emoji: "📅", description: "Been active for 30 days." }
  ];
  
