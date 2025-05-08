export async function awardAchievement(userId, name, usersCollection) {
    const user = await usersCollection.findOne({ _id: userId });
    if (!user) return;

    const alreadyHas = (user.achievements || []).some((a) => a.name === name);
    if (!alreadyHas) {
        await usersCollection.updateOne(
            { _id: userId },
            {
                $push: {
                    achievements: {
                        name,
                        earnedOn: new Date().toISOString().split("T")[0],
                    },
                },
            }
        );
    }
}
