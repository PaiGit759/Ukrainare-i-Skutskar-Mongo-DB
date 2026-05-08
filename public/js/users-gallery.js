const itemsPerPage = 18;
const pagesPerGroup = 5;
let currentPage = 1;
let totalItems = 0;

function showSpinner() {
    document.getElementById("spinner").style.display = "block";
}

function hideSpinner() {
    document.getElementById("spinner").style.display = "none";
}

async function fetchTotalCount() {
    try {
        const res = await fetch(`/users/count`);
        const data = await res.json();

        totalItems = data.count;
        currentPage = parseInt(new URLSearchParams(window.location.search).get("page")) || 1;

        renderPagination();
        fetchUsersPage(currentPage);

    } catch (err) {
        console.error("Error getting number of users:", err);
    }
}

async function fetchUsersPage(page) {
    try {
        const params = new URLSearchParams(window.location.search);
        params.set("page", page);
        params.set("limit", itemsPerPage);

        const res = await fetch(`/users/page?${params.toString()}`);
        const data = await res.json();

        const pageUsers = data.map((user, i) => ({
            name: user.name,
            fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            foto: user.foto || "/image/UndefinedUser.jpg",
            createdAt: new Date(user.createdAt).toISOString().slice(0, 19).replace("T", " "),
            id: user._id,
            index: i + 1 + itemsPerPage * (page - 1)
        }));

        renderUsers(pageUsers, page);

    } catch (err) {
        console.error("Ошибка загрузки пользователей:", err);
    }
}

async function renderUsers(users, page) {
    showSpinner();

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    const pageHeader = document.createElement("h5");
    pageHeader.className = "text-center my-0";
    pageHeader.textContent = `Page № ${page}`;
    gallery.appendChild(pageHeader);

    users.forEach(user => {
        const col = document.createElement("div");
        col.className = "col-12 col-sm-6 col-md-3 col-lg-2";

        col.innerHTML = `
            <div class="card h-100 user-card">
                <img src="${user.foto}" class="card-img-top" alt="${user.name}" />
                <div class="card-body text-center">
                    <h6 class="card-title"><b>${user.name}</b> (${user.fullName})</h6>
                    <h6 class="card-title"> № ${user.index} (${user.createdAt})</h6>

                    <button class="btn btn-primary btn-sm"
                        onclick="openUser('${user.id}', ${page})">
                        Read more
                    </button>
                </div>
            </div>
        `;

        gallery.appendChild(col);
    });

    hideSpinner();
}

function openUser(id, page) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page);

    window.location.href = `/profile?id=${id}`;
}

function renderPagination() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const groupIndex = Math.floor((currentPage - 1) / pagesPerGroup);
    const start = groupIndex * pagesPerGroup + 1;
    const end = Math.min(start + pagesPerGroup - 1, totalPages);

    pagination.appendChild(createPageItem("<<", 1, currentPage === 1));
    pagination.appendChild(createPageItem("<", start - 1, start === 1));

    for (let i = start; i <= end; i++) {
        pagination.appendChild(createPageItem(i, i, false, i === currentPage));
    }

    pagination.appendChild(createPageItem(">", end + 1, end === totalPages));
    pagination.appendChild(createPageItem(">>", totalPages, currentPage === totalPages));
}

function createPageItem(label, page, disabled, active = false) {
    const li = document.createElement("li");
    li.className = `page-item ${active ? "active" : ""} ${disabled ? "disabled" : ""}`;

    const btn = document.createElement("button");

    btn.className = "page-link page-btn";
    btn.textContent = label;

    btn.onclick = () => {
        if (disabled || !page || isNaN(page)) return;

        const params = new URLSearchParams(window.location.search);
        params.set("page", page);
        params.set("limit", itemsPerPage);

        currentPage = page;

        history.replaceState(null, "", `${location.pathname}?${params.toString()}`);

        localStorage.setItem("returnTo", `${location.pathname}?${params.toString()}`);

        fetchUsersPage(currentPage);
        renderPagination();
    };

    li.appendChild(btn);
    return li;
}

function openUser(id, page) {
    // save the user gallery URL
    localStorage.setItem("returnToProfile", location.href);

    window.location.href = `/profile?id=${id}`;
}


fetchTotalCount();
