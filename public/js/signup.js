document.addEventListener("DOMContentLoaded", () => {
    const gamesSelect = document.getElementById("favoriteGames");
    const charactersSelect = document.getElementById("favoriteCharacters");

    async function fetchCharacters(game) {
        try {
            const res = await fetch(
                `/api/characters?game=${encodeURIComponent(game)}`
            );
            if (!res.ok) return [];
            const data = await res.json();
            return data.characters || [];
        } catch (e) {
            console.error(`Failed to load characters for ${game}`, e);
            return [];
        }
    }

    async function updateCharacters() {
        charactersSelect.innerHTML = ""; // reset
        const selectedGames = Array.from(gamesSelect.selectedOptions)
            .map((o) => o.value)
            .filter((v) => v !== "None");

        let allCharacters = [];
        for (const game of selectedGames) {
            const chars = await fetchCharacters(game);
            allCharacters = [...allCharacters, ...chars];
        }

        const seen = new Set();
        allCharacters.forEach((char) => {
            if (!seen.has(char)) {
                seen.add(char);
                const opt = document.createElement("option");
                opt.value = char;
                opt.textContent = char;
                charactersSelect.appendChild(opt);
            }
        });
    }

    gamesSelect.addEventListener("change", updateCharacters);
});
