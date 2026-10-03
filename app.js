const storageKey = "book-library-tracker";

const form = document.querySelector("#book-form");
const formTitle = document.querySelector("#form-title");
const titleInput = document.querySelector("#title");
const authorInput = document.querySelector("#author");
const statusInput = document.querySelector("#status");
const ratingInput = document.querySelector("#rating");
const ratingField = document.querySelector("#rating-field");
const submitButton = document.querySelector("#submit-button");
const cancelEditButton = document.querySelector("#cancel-edit");
const formMessage = document.querySelector("#form-message");
const bookList = document.querySelector("#book-list");
const searchInput = document.querySelector("#search");

const statusNames = {
  read: "Read",
  reading: "Reading",
  "want-to-read": "Want to read",
};

let books = loadBooks();
let activeFilter = "all";
let editingId = null;

function loadBooks() {
  try {
    const savedBooks = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(savedBooks) ? savedBooks : [];
  } catch {
    return [];
  }
}

function saveBooks() {
  localStorage.setItem(storageKey, JSON.stringify(books));
}

function showRatingForStatus() {
  const isRead = statusInput.value === "read";
  ratingField.hidden = !isRead;
  ratingInput.required = isRead;
  if (!isRead) ratingInput.value = "";
}

function updateStats() {
  document.querySelector("#read-count").textContent = books.filter(
    (book) => book.status === "read",
  ).length;
  document.querySelector("#reading-count").textContent = books.filter(
    (book) => book.status === "reading",
  ).length;
  document.querySelector("#total-count").textContent = books.length;
  document.querySelector("#all-filter-count").textContent = books.length;
}

function setActiveFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".filter-button").forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderBooks();
}

function createBookRow(book, index) {
  const row = document.createElement("article");
  row.className = "book-row";

  const cover = document.createElement("div");
  cover.className = `book-cover color-${index % 4}`;
  cover.setAttribute("aria-hidden", "true");
  cover.textContent = book.title.trim().charAt(0) || "B";

  const info = document.createElement("div");
  info.className = "book-info";

  const title = document.createElement("h3");
  title.className = "book-title";
  title.textContent = book.title;

  const author = document.createElement("p");
  author.className = "book-author";
  author.textContent = book.author;
  info.append(title, author);

  if (book.status === "read" && book.rating) {
    const rating = document.createElement("div");
    rating.className = "book-rating";
    rating.setAttribute("aria-label", `${book.rating} out of 5 stars`);
    rating.textContent = `${"★".repeat(Number(book.rating))}${"☆".repeat(5 - Number(book.rating))}`;
    info.append(rating);
  }

  const side = document.createElement("div");
  side.className = "book-side";

  const status = document.createElement("span");
  status.className = `status-label status-${book.status}`;
  status.textContent = statusNames[book.status] || "Want to read";

  const actions = document.createElement("div");
  actions.className = "book-actions";

  const editButton = document.createElement("button");
  editButton.className = "text-button";
  editButton.type = "button";
  editButton.textContent = "Edit";
  editButton.setAttribute("aria-label", `Edit ${book.title}`);
  editButton.addEventListener("click", () => startEditing(book));

  const deleteButton = document.createElement("button");
  deleteButton.className = "text-button delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "Remove";
  deleteButton.setAttribute("aria-label", `Remove ${book.title}`);
  deleteButton.addEventListener("click", () => removeBook(book.id));

  actions.append(editButton, deleteButton);
  side.append(status, actions);
  row.append(cover, info, side);
  return row;
}

function renderBooks() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const visibleBooks = books.filter((book) => {
    const matchesFilter =
      activeFilter === "all" || book.status === activeFilter;
    const matchesSearch = `${book.title} ${book.author}`
      .toLocaleLowerCase()
      .includes(query);
    return matchesFilter && matchesSearch;
  });

  bookList.replaceChildren();
  updateStats();

  if (visibleBooks.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";

    const message = document.createElement("strong");
    const detail = document.createElement("p");

    if (books.length === 0) {
      message.textContent = "Your shelf is empty.";
      detail.textContent = "Add a book to get started.";
    } else {
      message.textContent = query
        ? "No matches this time."
        : "Nothing in this list yet.";
      detail.textContent = query
        ? "Try another title or author."
        : "Choose another status to see more books.";
    }

    emptyState.append(message, detail);
    bookList.append(emptyState);
    return;
  }

  visibleBooks.forEach((book, index) =>
    bookList.append(createBookRow(book, index)),
  );
}

function startEditing(book) {
  editingId = book.id;
  titleInput.value = book.title;
  authorInput.value = book.author;
  statusInput.value = book.status;
  ratingInput.value = book.rating || "";
  formTitle.textContent = "Edit book";
  submitButton.textContent = "Save changes";
  cancelEditButton.hidden = false;
  formMessage.textContent = "";
  showRatingForStatus();
  titleInput.focus();
}

function resetForm() {
  editingId = null;
  form.reset();
  formTitle.textContent = "Add a book";
  submitButton.textContent = "Add book";
  cancelEditButton.hidden = true;
  formMessage.textContent = "";
  showRatingForStatus();
}

function removeBook(id) {
  books = books.filter((book) => book.id !== id);
  saveBooks();
  if (editingId === id) resetForm();
  renderBooks();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const isEditing = Boolean(editingId);

  const book = {
    id: editingId || crypto.randomUUID(),
    title: titleInput.value.trim(),
    author: authorInput.value.trim(),
    status: statusInput.value,
    rating: statusInput.value === "read" ? ratingInput.value : "",
  };

  if (isEditing) {
    books = books.map((item) => (item.id === editingId ? book : item));
  } else {
    books.unshift(book);
  }

  saveBooks();
  resetForm();
  setActiveFilter(isEditing ? activeFilter : "all");
  titleInput.focus();
});

statusInput.addEventListener("change", showRatingForStatus);
cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderBooks);

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveFilter(button.dataset.filter);
  });
});

showRatingForStatus();
renderBooks();
