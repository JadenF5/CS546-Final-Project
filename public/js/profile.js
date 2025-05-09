document.addEventListener("DOMContentLoaded", function () {
    console.log("Profile JS loaded!");

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
