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

// Marvel Rivals
export async function getMarvelRivalsCharacters(includeDetails = false) {
    const res = await axios.get("https://marvelrivalsapi.com/api/v1/heroes", {
        headers: {
            "x-api-key": KEYS.marvelRivals,
        },
    });

    if (includeDetails) {
        return res.data.map((hero) => ({
            name: hero.name,
            role: hero.role || hero.class || "Unknown",
            imageUrl: `https://marvelrivalsapi.com${hero.imageUrl}`,
            description: hero.description || `A hero in Marvel Rivals`,
        }));
    } else {
        return res.data.map((hero) => hero.name);
    }
}

// League of Legends
export async function getLeagueCharacters(includeDetails = false) {
    const version = "14.9.1";
    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;
    const { data } = await axios.get(url);

    if (includeDetails) {
        return Object.values(data.data).map((champ) => ({
            name: champ.name,
            role: champ.tags[0] || "Unknown",
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`,
            description: champ.blurb,
        }));
    } else {
        return Object.values(data.data).map((champ) => champ.name);
    }
}

// Teamfight Tactics
export async function getTFTChampions(includeDetails = false) {
    const version = "13.24.1";
    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-champion.json`;

    const res = await axios.get(url);
    const data = res.data.data;

    if (includeDetails) {
        return Object.values(data).map((champ) => {
            let role = "TFT Champion";
            if (
                champ.traits &&
                Array.isArray(champ.traits) &&
                champ.traits.length > 0
            ) {
                role = champ.traits[0];
            }
            let imageUrl = "";
            if (champ.image && champ.image.full) {
                imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-champion/${champ.image.full}`;
            }

            return {
                name: champ.name,
                role: role,
                imageUrl: imageUrl,
                description:
                    champ.ability?.desc || `A champion in Teamfight Tactics`,
            };
        });
    } else {
        return Object.values(data).map((champ) => {
            const championData = {
                name: champ.name,
                traits: ["TFT Champion"],
            };

            if (
                champ.traits &&
                Array.isArray(champ.traits) &&
                champ.traits.length > 0
            ) {
                championData.traits = champ.traits;
            }

            return championData;
        });
    }
}

// Valorant
export async function getValorantAgents(includeDetails = false) {
    const url = `https://valorant-api.com/v1/agents`;
    const { data } = await axios.get(url);
    const agents = data.data.filter((agent) => agent.isPlayableCharacter);

    if (includeDetails) {
        return agents.map((agent) => ({
            name: agent.displayName,
            role: agent.role?.displayName || "Unknown",
            imageUrl:
                agent.displayIcon ||
                agent.fullPortrait ||
                agent.killfeedPortrait,
            description: agent.description,
        }));
    } else {
        return agents.map((agent) => agent.displayName);
    }
}

// Overwatch 2 - using OverFast API
export async function getOverwatch2Heroes(includeDetails = false) {
    const res = await axios.get("https://overfast-api.tekrop.fr/heroes", {
        params: {
            locale: "en-us",
        },
    });

    if (includeDetails) {
        return res.data.map((hero) => ({
            name: hero.name,
            role: hero.role,
            imageUrl: hero.portrait,
            description:
                hero.description || `An ${hero.role} hero in Overwatch 2`,
        }));
    } else {
        return res.data.map((hero) => ({
            name: hero.name,
            key: hero.key,
            role: hero.role,
            portrait: hero.portrait,
        }));
    }
}
