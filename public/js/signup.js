document.addEventListener("DOMContentLoaded", function () {
    const checkboxes = document.querySelectorAll(
        '#favoriteGames input[type="checkbox"]'
    );
    const charactersWrapper = document.getElementById("charactersWrapper");
    const charactersSelect = document.getElementById("favoriteCharacters");

    // Get character data from server
    const allGameCharacters = window.allGameCharacters || {}; // from server

    function updateCharacterOptions() {
        // Clear existing options
        charactersSelect.innerHTML = "";

        let anyChecked = false;

        // For each checked game, add its characters as options
        checkboxes.forEach((checkbox) => {
            if (checkbox.checked) {
                const game = checkbox.value;
                anyChecked = true;
                const characters = allGameCharacters[game] || [];

                // Add characters for this game
                characters.forEach((char) => {
                    const option = document.createElement("option");
                    option.value = `${game}:${char}`;
                    option.text = `${char} (${game})`;
                    charactersSelect.appendChild(option);
                });
            }
        });

        // Show or hide the characters wrapper based on whether any games are checked
        charactersWrapper.style.display = anyChecked ? "block" : "none";

        // Log for debugging
        console.log("Games checked:", anyChecked);
        console.log(
            "Character options updated:",
            charactersSelect.options.length
        );
    }

    // Add event listeners to checkboxes
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", updateCharacterOptions);
    });

    // Initial call to set correct state
    updateCharacterOptions();
});
