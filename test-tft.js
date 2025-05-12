// test-tft.js
import { getTFTChampions } from "./services/gameApi.js";

async function runTest() {
    console.log("Fetching TFT champions with trait info...");
    const champions = await getTFTChampions(true);

    console.log(`Fetched ${champions.length} champions.\n`);

    // Display the first 3 champions with traits for inspection
    champions.slice(0, 3).forEach((champ, index) => {
        console.log(
            "Raw champion object:",
            JSON.stringify(champions[0], null, 2)
        );
        console.log(`Champion ${index + 1}: ${champ.name}`);
        console.log(`Image: ${champ.imageUrl}`);
        console.log(`Traits:`);
        champ.traits.forEach((trait) =>
            console.log(`  - ${trait.name} (${trait.icon})`)
        );
        console.log(`Description: ${champ.description}`);
        console.log("-----");
    });
}

runTest();
