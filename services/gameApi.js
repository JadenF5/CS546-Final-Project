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
    const champUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-champion.json`;

    // Static mapping for Set 10
    const set10Traits = {
        Ahri: ["KDA", "Spellweaver"],
        Akali: ["KDA", "Breakout"],
        Amumu: ["Emo", "Guardian"],
        Annie: ["Emo", "Superfan"],
        Aphelios: ["Country", "Rapidfire"],
        Bard: ["Jazz", "Sentinel"],
        Blitzcrank: ["Disco", "Guardian"],
        Caitlyn: ["8-bit", "Rapidfire"],
        Corki: ["Country", "Mosher"],
        Ekko: ["True Damage", "Sentinel"],
        Evelynn: ["KDA", "Executioner"],
        Garen: ["8-bit", "Bruiser"],
        Gragas: ["Jazz", "Bruiser"],
        Jax: ["EDM", "Mosher"],
        Jhin: ["Maestro", "Big Shot"],
        Jinx: ["Punk", "Mosher"],
        Kayle: ["Pentakill", "Edgelord"],
        Karthus: ["Pentakill", "Executioner"],
        Kennen: ["Punk", "Superfan"],
        Lucian: ["Jazz", "Rapidfire"],
        Lillia: ["KDA", "Spellweaver"],
        Lulu: ["Hyperpop", "Spellweaver"],
        Lux: ["EDM", "Spellweaver"],
        MissFortune: ["Disco", "Big Shot"],
        Mordekaiser: ["Pentakill", "Mosher"],
        Nami: ["EDM", "Superfan"],
        Neeko: ["Hyperpop", "Guardian"],
        Olaf: ["Pentakill", "Bruiser"],
        Pantheon: ["Country", "Bruiser"],
        Poppy: ["8-bit", "Mosher"],
        Qiyana: ["True Damage", "Mosher"],
        Samira: ["Jazz", "Executioner"],
        Senna: ["True Damage", "Executioner"],
        Seraphine: ["KDA", "Big Shot"],
        Sett: ["Country", "Edgelord"],
        Sona: ["EDM", "Sentinel"],
        TahmKench: ["Jazz", "Bruiser"],
        Taric: ["Disco", "Sentinel"],
        Thresh: ["Pentakill", "Guardian"],
        TwistedFate: ["Disco", "Dazzler"],
        TwistedFateRemix: ["Disco", "Big Shot"],
        Twitch: ["Punk", "Executioner"],
        Urgot: ["Country", "Executioner"],
        Vex: ["Emo", "Executioner"],
        Vi: ["Punk", "Bruiser"],
        Viego: ["Pentakill", "Edgelord"],
        Yone: ["Pentakill", "Edgelord"],
        Yorick: ["Pentakill", "Sentinel"],
        Zed: ["True Damage", "Edgelord"],
        Ziggs: ["Hyperpop", "Dazzler"],
        Zilean: ["Disco", "Dazzler"],
    };

    try {
        const res = await axios.get(champUrl);
        const champions = res.data.data;

        return Object.values(champions).map((champ) => {
            const imageUrl = champ.image
                ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-champion/${champ.image.full}`
                : "";

            const traits = set10Traits[champ.name] || [];

            return {
                name: champ.name,
                imageUrl,
                traits: traits.map((t) => ({
                    name: t,
                    icon: "",
                })),
                description: champ.ability?.desc || "A champion in TFT",
            };
        });
    } catch (err) {
        console.error("Error fetching TFT champions:", err.message);
        return [];
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
