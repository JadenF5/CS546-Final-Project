document.addEventListener("DOMContentLoaded", function () {
    const characterSearch = document.getElementById("characterSearch");
    if (characterSearch) {
        characterSearch.addEventListener("input", function () {
            const searchValue = this.value.toLowerCase();
            const characterCards = document.querySelectorAll(".character-card");

            characterCards.forEach((card) => {
                const characterName = card
                    .getAttribute("data-character")
                    .toLowerCase();
                if (characterName.includes(searchValue)) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    }

    const characterFilter = document.getElementById("characterFilter");
    if (characterFilter) {
        characterFilter.addEventListener("change", function () {
            const selectedCharacter = this.value;
            const threadCards = document.querySelectorAll(".thread-card");

            threadCards.forEach((card) => {
                if (
                    selectedCharacter === "" ||
                    card.getAttribute("data-character") === selectedCharacter
                ) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });
        });
    }

    const addFavoriteButton = document.querySelector(".add-favorite-game");
    if (addFavoriteButton) {
        addFavoriteButton.addEventListener("click", function () {
            const gameName = this.getAttribute("data-game");
            fetch("/api/games/favorite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ gameName: gameName }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        window.location.reload();
                    } else {
                        console.error(
                            "Error adding game to favorites:",
                            data.message
                        );
                    }
                })
                .catch((error) => {
                    console.error("Error adding game to favorites:", error);
                });
        });
    }

    const removeFavoriteButton = document.querySelector(
        ".remove-favorite-game"
    );
    if (removeFavoriteButton) {
        removeFavoriteButton.addEventListener("click", function () {
            const gameName = this.getAttribute("data-game");
            fetch("/api/games/favorite", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ gameName: gameName }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        window.location.reload();
                    } else {
                        console.error(
                            "Error removing game from favorites:",
                            data.message
                        );
                    }
                })
                .catch((error) => {
                    console.error("Error removing game from favorites:", error);
                });
        });
    }

    const threadSort = document.getElementById("threadSort");
    if (threadSort) {
        threadSort.addEventListener("change", function () {
            const sortValue = this.value;
            const threadsList = document.querySelector(".threads-list");
            const threadCards = Array.from(
                document.querySelectorAll(".thread-card")
            );

            if (sortValue === "popular") {
                threadCards.sort((a, b) => {
                    const aLikes = parseInt(
                        a.querySelector(".likes").textContent
                    );
                    const bLikes = parseInt(
                        b.querySelector(".likes").textContent
                    );
                    return bLikes - aLikes;
                });
            } else {
                threadCards.sort((a, b) => {
                    const aDate = new Date(
                        a.querySelector(".thread-date").textContent
                    );
                    const bDate = new Date(
                        b.querySelector(".thread-date").textContent
                    );
                    return bDate - aDate;
                });
            }

            threadCards.forEach((card) => card.remove());

            threadCards.forEach((card) => threadsList.appendChild(card));
        });
    }

    const characterPlaceholders = document.querySelectorAll(
        ".character-placeholder"
    );

    characterPlaceholders.forEach((placeholder) => {
        const characterName = placeholder.getAttribute("data-name");
        if (characterName) {
            placeholder.textContent = characterName.charAt(0).toUpperCase();
        } else {
            placeholder.textContent = "?";
        }
    });

    const characterImages = document.querySelectorAll(".character-image img");

    characterImages.forEach((img) => {
        img.addEventListener("error", function () {
            const name = this.getAttribute("alt") || "?";
            const placeholder = document.createElement("div");
            placeholder.className = "character-placeholder";
            placeholder.textContent = name.charAt(0).toUpperCase();

            this.parentNode.replaceChild(placeholder, this);
        });
    });
});
