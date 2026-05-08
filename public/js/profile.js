console.log("PROFILE SCRIPT LOADED");

// 1. If we are on the profile page, we try to restore returnParams from referrer
if (window.location.pathname.startsWith("/profile")) {
    const saved = localStorage.getItem("returnParams");

    // If there is no returnParams, we try to restore it.
    if (!saved || saved.length === 0) {
        const ref = document.referrer;

        if (ref.includes("/users")) {
            const query = ref.split("?")[1] || "";
            localStorage.setItem("returnParams", query);
            //            console.log("Restored returnParams from referrer:", query);
        }
    }
}

// 2. A universal interceptor for profile visits (except for the profile page itself)
if (!window.location.pathname.startsWith("/profile")) {
    document.addEventListener("click", (e) => {
        const link = e.target.closest("a[href^='/profile?id=']");
        if (!link) return;

        e.preventDefault();

        const url = new URL(link.href);
        const id = url.searchParams.get("id");

        const params = new URLSearchParams(window.location.search);
        localStorage.setItem("returnParams", params.toString());

        window.location.href = `/profile?id=${id}`;
    });
}

// 3. Return button handler
document.addEventListener("click", (e) => {
    if (e.target.id !== "btnReturn") return;

    e.preventDefault();

    const saved = localStorage.getItem("returnParams");

    if (saved && saved.length > 0) {
        console.log("RETURN → /users?" + saved);
        window.location.href = `/users?${saved}`;
    } else {
        console.log("RETURN → fallback /users?page=1");
        window.location.href = "/users?page=1";
    }
});
