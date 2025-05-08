import axios from "axios";
const MARVEL_API_KEY =
    "e736f7a0f1fc493f8bb02974b557174a132040d729bd8ac77e449e783c6a01d4";

const KEYS = {
    marvelRivals:
        "e736f7a0f1fc493f8bb02974b557174a132040d729bd8ac77e449e783c6a01d4",
    league: "RGAPI-7049d666-762e-426e-883f-acea94ab15a7",
    tft: "RGAPI-773f057b-1396-4f54-8caa-226120a13e12",
    valorant: "RGAPI-773f057b-1396-4f54-8caa-226120a13e12",
};

// Marvel Rivals (mock example)
export async function getMarvelRivalsCharacters() {
    try {
        const res = await axios.get(
            "https://marvelrivalsapi.com/api/v1/heroes",
            {
                headers: {
                    "x-api-key": KEYS.marvelRivals,
                },
            }
        );

        // Return just hero names for dropdown
        return res.data.map((hero) => hero.name);
    } catch (e) {
        console.error("Marvel Rivals API failed. Using fallback.", e.message);
        return ["Iron Man", "Doctor Strange", "Storm", "Magneto", "Star-Lord"];
    }
}

// League of Legends
export async function getLeagueCharacters() {
    const url = `https://ddragon.leagueoflegends.com/cdn/14.9.1/data/en_US/champion.json`;
    const { data } = await axios.get(url);
    return Object.values(data.data).map((champ) => champ.name);
}

// Teamfight Tactics
export async function getTFTChampions() {
    try {
        const version = "13.24.1"; // Use latest version, or fetch dynamically
        const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-champion.json`;

        const res = await axios.get(url);
        const data = res.data.data;

        return Object.values(data).map((champ) => champ.name);
    } catch (e) {
        console.error("TFT champion fetch failed. Using fallback.", e.message);
        return ["Aatrox", "Ahri", "Jinx", "Irelia", "Yasuo"];
    }
}

// Valorant
export async function getValorantAgents() {
    const url = `https://valorant-api.com/v1/agents`;
    const { data } = await axios.get(url);
    return data.data
        .filter((agent) => agent.isPlayableCharacter)
        .map((agent) => agent.displayName);
}
