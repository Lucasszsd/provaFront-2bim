document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "http://servicodados.ibge.gov.br/api/v3/noticias";
  const searchForm = document.getElementById("search-form");
  const filterIcon = document.getElementById("filter-icon");
  const filterDialog = document.getElementById("filter-dialog");
  const filterForm = document.getElementById("filter-form");
  const applyFiltersButton = document.getElementById("apply-filters");
  const closeDialogButton = document.getElementById("close-dialog");
  const newsList = document.getElementById("news-list");
  const pagination = document.getElementById("pagination");
  const activeFilters = document.getElementById("active-filters");

  fetchNews();

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateQueryString();
    fetchNews();
  });

  filterIcon.addEventListener("click", () => filterDialog.showModal());
  closeDialogButton.addEventListener("click", () => filterDialog.close());
  applyFiltersButton.addEventListener("click", () => {
    filterDialog.close();
    updateQueryString();
    fetchNews();
  });

  function updateQueryString() {
    const searchParams = new URLSearchParams(window.location.search);
    const searchInput = document.getElementById("search-input").value;
    if (searchInput) searchParams.set("busca", searchInput);
    else searchParams.delete("busca");

    const formData = new FormData(filterForm);
    for (const [key, value] of formData.entries()) {
      if (value && typeof value === "string") {
        searchParams.set(key, value);
      } else {
        searchParams.delete(key);
      }
    }
    history.replaceState(null, "", "?" + searchParams.toString());
    updateActiveFilters();
  }

  function updateActiveFilters() {
    const searchParams = new URLSearchParams(window.location.search);
    let activeCount = 0;
    for (const [key, value] of searchParams.entries()) {
      if (key !== "page" && key !== "busca" && key !== "qtd") activeCount++;
    }
    activeFilters.textContent = activeCount;
  }

  function fetchNews() {
    const searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.has("qtd")) {
      searchParams.set("qtd", 5);
    }
    const finalUrl = `${apiUrl}?${searchParams.toString()}`;
    fetch(finalUrl)
      .then((response) => response.json())
      .then((data) => {
        renderNews(data.items);
        renderPagination(data.total);
      });
  }

  function renderNews(news) {
    newsList.innerHTML = "";
    news.forEach((item) => {
      const newsItem = document.createElement("li");
      const imgUrl = JSON.parse(item.imagens);
      newsItem.innerHTML = `
        <div id="noticia">
          <img src="https://agenciadenoticias.ibge.gov.br/${
            imgUrl.image_intro
          }" alt="${item.titulo}">
          <h2>${item.titulo}</h2>
          <p>${item.introducao}</p>
          <p>#${item.editorias}</p>
          <p>Publicado ${calculateTimeAgo(item.data_publicacao)}</p>
          <a href="${item.link}" target="_blank">Leia Mais</a>
        </div>
      `;
      newsList.appendChild(newsItem);
    });
  }

  function renderPagination(totalItems) {
    const itemsPerPage = 5;
    const currentPage =
      parseInt(new URLSearchParams(window.location.search).get("page")) || 1;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    pagination.innerHTML = "";

    const maxButtons = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageItem = document.createElement("li");
      const pageButton = document.createElement("button");
      pageButton.textContent = i;
      if (i === currentPage) pageButton.style.backgroundColor = "#4682b4";
      pageButton.addEventListener("click", () => {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set("page", i);
        history.replaceState(null, "", "?" + searchParams.toString());
        fetchNews();
      });
      pageItem.appendChild(pageButton);
      pagination.appendChild(pageItem);
    }
  }

  function calculateTimeAgo(dateString) {
    const dateObj = new Date(dateString);

    if (isNaN(dateObj.getTime())) {
      return "Data inválida";
    }

    const now = new Date();
    const diffTime = Math.abs(now - dateObj);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "hoje";
    if (diffDays === 1) return "ontem";
    return `há ${diffDays} dias`;
  }

  function initializeFilters() {
    const searchParams = new URLSearchParams(window.location.search);
    document.getElementById("search-input").value =
      searchParams.get("busca") || "";

    for (const [key, value] of searchParams.entries()) {
      const element = filterForm.elements[key];
      if (element) {
        element.value = value;
      }
    }
  }

  initializeFilters();
});
