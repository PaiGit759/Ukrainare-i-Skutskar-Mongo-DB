const itemsPerPage = 10;
const pagesPerGroup = 5;
let currentPage = 1;
let totalItems = 0;

// Loading the total number of objects
async function fetchTotalCount() {
    try {
        const res = await fetch(`/forum/count`);
        const data = await res.json();

        totalItems = data.count;
        currentPage = parseInt(new URLSearchParams(window.location.search).get("page")) || 1;

        renderPagination();
        fetchForumPage(currentPage);

    } catch (err) {
        console.error("Ошибка получения количества объектов форума:", err);
    }
}

// Loading the objects page
async function fetchForumPage(page) {
    try {
        const params = new URLSearchParams(window.location.search);
        params.set("page", page);
        params.set("limit", itemsPerPage);

        const res = await fetch(`/forum/page?${params.toString()}`);
        const data = await res.json();

        renderForum(data, page);

    } catch (err) {
        console.error("Ошибка загрузки страницы форума:", err);
    }
}

// Forum feed render

function renderForum(items, page) {
    const list = document.getElementById("forum-list");
    list.innerHTML = "";

    items.forEach(post => {
        const div = document.createElement("div");
        div.className = "forum-item";

        /*         let content = post.isBlocked
                    ? `<span class="text-danger fw-bold">${post.blockedMessage}</span>`
                    : post.content;
         */

        let content = post.isBlocked
            ? `<span class="text-danger fw-bold">${post.blockedMessage}</span>`
            : post.content
                .replace(/\n/g, "<br>")
                .replace(/\((\d+)\)/g, '<span class="reply-link" data-target="post-$1">($1)</span>');


        const isAuthor = String(currentUser.id) === String(post.userId);
        const isAdmin = currentUser.role === "admin";

        let editButton = "";
        if (!post.isBlocked || isAdmin) {
            if (isAdmin || isAuthor) {
                editButton = `
            <button class="btn btn-warning btn-sm ms-2"
                    onclick="editPost('${post.id}')">
                Edit
            </button>
        `;
            }
        }

        let deleteButton = "";
        if (isAdmin) {
            deleteButton = `
                <button class="btn btn-danger btn-sm ms-2"
                        onclick="blockPost('${post.id}')">
                    X
                </button>
            `;
        }

        div.innerHTML = `
            <div class="d-flex align-items-center gap-3 mb-2">

                <img src="${post.userFoto}" class="rounded-circle"
                    style="width:45px; height:45px; object-fit:cover; cursor:pointer;"
                    onclick="openForumUser('${post.userId}')">

                <div style="cursor:pointer;" onclick="openForumUser('${post.userId}')">
                    <div class="fw-bold">${post.userName}</div>
                    <div class="text-muted" style="font-size:0.85rem;">
                        Created: ${new Date(post.createdAt).toLocaleString()}
                    </div>
                </div>


<div class="ms-auto d-flex align-items-center">

<button class="icon-btn" onclick="openPost('${post.id}')" title="Open">
    <img src="${"/image/icons/open.svg"}">
</button>

</div>

            </div>

            <div class="d-flex justify-content-between text-muted" style="font-size:0.85rem;">
                <div>Answers: ${post.replyCount ?? 0}</div>
                <div>Last reply: 
                    ${post.lastReplyAt ? new Date(post.lastReplyAt).toLocaleString() : "—"}
                </div>
            </div>
        `;
        const contentDiv = document.createElement("div");
        contentDiv.className = "mb-2";
        contentDiv.innerHTML = content; // ← HTML остаётся HTML
        div.appendChild(contentDiv);



        list.appendChild(div);
    });
}

// Render pagination (top and bottom)
function renderPagination() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const pagTop = document.getElementById("pagination-top");
    const pagBottom = document.getElementById("pagination-bottom");

    pagTop.innerHTML = "";
    pagBottom.innerHTML = "";

    const groupIndex = Math.floor((currentPage - 1) / pagesPerGroup);
    const start = groupIndex * pagesPerGroup + 1;
    const end = Math.min(start + pagesPerGroup - 1, totalPages);

    const createBtn = (label, page, disabled, active = false) => {
        const li = document.createElement("li");
        li.className = `page-item ${active ? "active" : ""} ${disabled ? "disabled" : ""}`;
        const btn = document.createElement("button");
        btn.className = "page-link";
        btn.textContent = label;

        btn.onclick = () => {
            if (disabled || !page || isNaN(page)) return;

            const params = new URLSearchParams(window.location.search);
            params.set("page", page);

            currentPage = page;

            history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
            fetchForumPage(currentPage);
            renderPagination();
        };

        li.appendChild(btn);
        return li;
    };

    const addButtons = (container) => {
        container.appendChild(createBtn("<<", 1, currentPage === 1));
        container.appendChild(createBtn("<", start - 1, start === 1));

        for (let i = start; i <= end; i++) {
            container.appendChild(createBtn(i, i, false, i === currentPage));
        }

        container.appendChild(createBtn(">", end + 1, end === totalPages));
        container.appendChild(createBtn(">>", totalPages, currentPage === totalPages));
    };

    addButtons(pagTop);
    addButtons(pagBottom);
}

function openForumUser(userId) {
    if (!userId || userId === "undefined") {
        alert("This post has no associated user.");
        return;
    }

    localStorage.setItem("returnToProfile", location.href);
    window.location.href = `/profile?id=${userId}`;
}

function openPost(id) {
    const page = new URL(location.href).searchParams.get("page") || 1;
    const scroll = window.scrollY;

    localStorage.setItem("returnToForum", JSON.stringify({
        page,
        scroll
    }));

    window.location.href = `/forum/post?id=${id}`;

}

function editPost(id) {
    window.location.href = `/forum/edit?id=${id}`;
}


function blockPost(id) {
    if (!confirm("Block post?")) return;

    fetch(`/forum/block?id=${id}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(() => {
            fetchForumPage(currentPage); // обновляем галерею
        })
        .catch(err => console.error(err));
}

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}


// Launch
fetchTotalCount();
