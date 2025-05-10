document.addEventListener("DOMContentLoaded", async () => {
    const list = document.getElementById("notifications-list");

    try {
        const res = await fetch("/notifications");

        if (!res.ok){
            throw new Error("Failed to fetch");
        }

        const data = await res.json();
        list.innerHTML = "";

        if (data.length === 0){
            list.innerHTML = "<p>No new notifications.</p>";
        }
        
        else{
            data.forEach((n) => {
                const div = document.createElement("div");
                div.className = "notif";
                div.innerHTML = `
                    <p>${n.message}</p>
                    <small>${new Date(n.timestamp).toLocaleString()}</small>
                `;

                if (n.type === "friend_request"){
                    const accept = document.createElement("button");
                    accept.textContent = "Accept";
                    accept.onclick = async () => {
                        try{
                            const res = await fetch("/friends/accept", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ fromUserId: n.fromUserId }),
                            });

                            if (res.ok){
                                div.remove();
                            }

                        }catch (e){
                            alert("Failed to accept request.");
                        }
                    };

                    const decline = document.createElement("button");
                    decline.textContent = "Decline";
                    decline.onclick = async () => {
                        try {
                            const res = await fetch("/friends/decline", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ fromUserId: n.fromUserId }),
                            });

                            if (res.ok){
                                div.remove();
                            }

                        } catch (e){
                            alert("Failed to decline request.");
                        }
                    };

                    div.appendChild(accept);
                    div.appendChild(decline);
                }

                list.appendChild(div);
            });
        }
    } catch (e){
        console.error("Error loading notifications:", e);
        list.innerHTML = "<p>Error loading notifications</p>";
    }
});

document.getElementById("mark-all-seen")?.addEventListener("click", async () => {
    try {
        const res = await fetch("/notifications/markSeen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        if (res.ok){
            // Reload to reflect updated "seen" status
            location.reload();
        }

        else{
            alert("Failed to mark notifications as read.");
        }

    } 
    
    catch (e){
        alert("Error marking notifications as read.");
        console.error(e);
    }
});
