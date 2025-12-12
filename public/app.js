const api = {
  token: null,
  headers() {
    return {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: "Bearer " + this.token } : {}),
    };
  },
  async post(url, body) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const error = await r.json().catch(() => ({ error: "Network error" }));
        return error;
      }
      return await r.json();
    } catch (err) {
      return { error: err.message };
    }
  },
  async get(url) {
    try {
      const r = await fetch(url, { headers: this.headers() });
      if (!r.ok) {
        const error = await r.json().catch(() => ({ error: "Network error" }));
        return error;
      }
      return await r.json();
    } catch (err) {
      return { error: err.message };
    }
  },
  async delete(url) {
    try {
      const r = await fetch(url, {
        method: "DELETE",
        headers: this.headers(),
      });
      if (!r.ok) {
        const error = await r.json().catch(() => ({ error: "Network error" }));
        return error;
      }
      return await r.json();
    } catch (err) {
      return { error: err.message };
    }
  },
};

const ws = new WebSocket(
  (location.protocol === "https:" ? "wss://" : "ws://") + location.host
);
let currentBoardId = null;

ws.addEventListener("message", (e) => {
  try {
    const data = JSON.parse(e.data);
    if (data.type === "board:created") {
      addBoardToList(data.board);
    } else if (data.type === "board:deleted") {
      removeBoardFromList(data.boardId);
      if (currentBoardId === data.boardId) {
        showBoardsView();
      }
    } else if (data.type === "list:created") {
      if (currentBoardId === data.list.boardId) {
        addListToDashboard(data.list);
      }
    } else if (data.type === "list:deleted") {
      removeListFromDashboard(data.listId);
    } else if (data.type === "card:created") {
      addCardToList(data.card);
    } else if (data.type === "card:deleted") {
      removeCardFromList(data.cardId);
    }
  } catch (err) {}
});

const el = (id) => document.getElementById(id);

function addBoardToList(b) {
  // Check if board already exists in the list to prevent duplicates
  const boardsList = el("boardsList");
  const existingBoards = Array.from(boardsList.children);
  const boardExists = existingBoards.some(
    (li) => li.dataset.boardId === b.id
  );
  if (boardExists) return;
  
  const li = document.createElement("li");
  li.dataset.boardId = b.id;
  
  const titleSpan = document.createElement("span");
  titleSpan.textContent = b.title + " (" + (b.id || "").slice(0, 8) + ")";
  titleSpan.style.cursor = "pointer";
  titleSpan.style.flex = "1";
  titleSpan.addEventListener("click", () => openBoard(b.id));
  li.appendChild(titleSpan);
  
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.style.marginLeft = "10px";
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${b.title}"?`)) {
      const res = await api.delete(`/api/boards/${b.id}`);
      if (res.error) {
        alert(res.error || "Delete failed");
      }
      // Board will be removed via WebSocket broadcast
    }
  });
  li.appendChild(deleteBtn);
  
  boardsList.appendChild(li);
}

function removeBoardFromList(boardId) {
  const boardsList = el("boardsList");
  const boardElement = Array.from(boardsList.children).find(
    (li) => li.dataset.boardId === boardId
  );
  if (boardElement) {
    boardElement.remove();
  }
}

async function refreshBoards() {
  const boards = await api.get("/api/boards");
  el("boardsList").innerHTML = "";
  (boards || []).forEach(addBoardToList);
}

el("register").addEventListener("click", async () => {
  const email = el("email").value;
  const password = el("password").value;
  const res = await api.post("/api/auth/register", { email, password });
  if (res.token) {
    api.token = res.token;
    el("auth").style.display = "none";
    el("boards").style.display = "";
    await refreshBoards();
  } else alert(res.error || "Register failed");
});

el("login").addEventListener("click", async () => {
  const email = el("email").value;
  const password = el("password").value;
  const res = await api.post("/api/auth/login", { email, password });
  if (res.token) {
    api.token = res.token;
    el("auth").style.display = "none";
    el("boards").style.display = "";
    await refreshBoards();
  } else alert(res.error || "Login failed");
});

el("createBoard").addEventListener("click", async () => {
  const title = el("boardTitle").value;
  if (!title) return;
  const res = await api.post("/api/boards", { title });
  if (res.id) {
    el("boardTitle").value = "";
    // Board will be added via WebSocket broadcast, no need to add here
  } else alert(res.error || "Create failed");
});

// Dashboard functions
async function openBoard(boardId) {
  currentBoardId = boardId;
  const board = await api.get(`/api/boards/${boardId}`);
  if (board.error) {
    alert(board.error);
    return;
  }
  
  el("boards").style.display = "none";
  el("dashboard").style.display = "block";
  el("dashboardTitle").textContent = board.title;
  
  renderDashboard(board);
}

function showBoardsView() {
  currentBoardId = null;
  el("dashboard").style.display = "none";
  el("boards").style.display = "block";
}

function renderDashboard(board) {
  const container = el("listsContainer");
  container.innerHTML = "";
  
  if (board.lists) {
    board.lists.forEach((list) => addListToDashboard(list));
  }
}

function addListToDashboard(list) {
  const container = el("listsContainer");
  const listDiv = document.createElement("div");
  listDiv.className = "list";
  listDiv.dataset.listId = list.id;
  
  const header = document.createElement("div");
  header.className = "list-header";
  header.innerHTML = `
    <span>${list.title}</span>
    <button class="list-delete" data-list-id="${list.id}">×</button>
  `;
  listDiv.appendChild(header);
  
  const cardsContainer = document.createElement("div");
  cardsContainer.className = "cards-container";
  listDiv.appendChild(cardsContainer);
  
  if (list.cards) {
    list.cards.forEach((card) => addCardToContainer(card, cardsContainer));
  }
  
  const addCardContainer = document.createElement("div");
  addCardContainer.className = "add-card-container";
  const cardInput = document.createElement("input");
  cardInput.className = "add-card-input";
  cardInput.placeholder = "Add a card...";
  cardInput.dataset.listId = list.id;
  cardInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      createCard(list.id, cardInput);
    }
  });
  const cardButton = document.createElement("button");
  cardButton.className = "add-card-button";
  cardButton.textContent = "Add Card";
  cardButton.addEventListener("click", () => createCard(list.id, cardInput));
  addCardContainer.appendChild(cardInput);
  addCardContainer.appendChild(cardButton);
  listDiv.appendChild(addCardContainer);
  
  header.querySelector(".list-delete").addEventListener("click", async () => {
    if (confirm(`Delete list "${list.title}"?`)) {
      const res = await api.delete(`/api/lists/${list.id}`);
      if (res.error) {
        alert(res.error);
      }
    }
  });
  
  container.appendChild(listDiv);
}

function removeListFromDashboard(listId) {
  const listElement = document.querySelector(`.list[data-list-id="${listId}"]`);
  if (listElement) {
    listElement.remove();
  }
}

function addCardToList(card) {
  const listElement = document.querySelector(`.list[data-list-id="${card.listId}"]`);
  if (listElement) {
    const cardsContainer = listElement.querySelector(".cards-container");
    if (cardsContainer) {
      addCardToContainer(card, cardsContainer);
    }
  }
}

function addCardToContainer(card, container) {
  const cardDiv = document.createElement("div");
  cardDiv.className = "card";
  cardDiv.dataset.cardId = card.id;
  
  const cardHeader = document.createElement("div");
  cardHeader.className = "card-header";
  
  const cardTitle = document.createElement("div");
  cardTitle.className = "card-title";
  cardTitle.textContent = card.title;
  cardHeader.appendChild(cardTitle);
  
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "card-delete";
  deleteBtn.textContent = "×";
  deleteBtn.addEventListener("click", async () => {
    if (confirm(`Delete card "${card.title}"?`)) {
      const res = await api.delete(`/api/cards/${card.id}`);
      if (res.error) {
        alert(res.error);
      }
    }
  });
  cardHeader.appendChild(deleteBtn);
  
  cardDiv.appendChild(cardHeader);
  
  if (card.description) {
    const desc = document.createElement("div");
    desc.className = "card-description";
    desc.textContent = card.description;
    cardDiv.appendChild(desc);
  }
  
  container.appendChild(cardDiv);
}

function removeCardFromList(cardId) {
  const cardElement = document.querySelector(`.card[data-card-id="${cardId}"]`);
  if (cardElement) {
    cardElement.remove();
  }
}

async function createCard(listId, input) {
  const title = input.value.trim();
  if (!title) return;
  
  const res = await api.post("/api/cards", { title, listId });
  if (res.id) {
    input.value = "";
  } else {
    alert(res.error || "Create failed");
  }
}

el("backToBoards").addEventListener("click", showBoardsView);

el("createList").addEventListener("click", async () => {
  const title = el("newListTitle").value.trim();
  if (!title || !currentBoardId) return;
  
  const res = await api.post("/api/lists", { title, boardId: currentBoardId });
  if (res.id) {
    el("newListTitle").value = "";
  } else {
    alert(res.error || "Create failed");
  }
});

el("newListTitle").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    el("createList").click();
  }
});
