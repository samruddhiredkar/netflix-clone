// 1. API Configuration
const API_KEY = "39861cfd811f742259e828847ff86b9c";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Helper function to properly encode the URL so the proxy doesn't strip your API key
function getProxyUrl(endpoint) {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(TMDB_BASE_URL + endpoint)}`;
}

// 2. The API Endpoints 
const requests = {
    fetchTrending: getProxyUrl(`/trending/all/week?api_key=${API_KEY}&language=en-US`),
    fetchNetflixOriginals: getProxyUrl(`/discover/tv?api_key=${API_KEY}&with_networks=213`),
    fetchActionMovies: getProxyUrl(`/discover/movie?api_key=${API_KEY}&with_genres=28`),
    fetchComedyMovies: getProxyUrl(`/discover/movie?api_key=${API_KEY}&with_genres=35`),
    fetchHorrorMovies: getProxyUrl(`/discover/movie?api_key=${API_KEY}&with_genres=27`),
    fetchRomanceMovies: getProxyUrl(`/discover/movie?api_key=${API_KEY}&with_genres=10749`),
    fetchDocumentaries: getProxyUrl(`/discover/movie?api_key=${API_KEY}&with_genres=99`),
};

console.log("My API Key is ready:", API_KEY);

// 3. Fetch Data and Update Banner
async function fetchBannerMovie() {
    try {
        const response = await fetch(requests.fetchNetflixOriginals);
        const data = await response.json();

        const randomIndex = Math.floor(Math.random() * data.results.length);
        const movie = data.results[randomIndex];

        document.getElementById('banner__title').innerText = movie.name || movie.title || movie.original_name;
        document.getElementById('banner__description').innerText = movie.overview;

        document.getElementById('banner').style.setProperty('--movie-bg', `url("https://image.tmdb.org/t/p/original/${movie.backdrop_path}")`);
    } catch (error) {
        console.error("Error fetching banner movie:", error);  
    }
}

fetchBannerMovie();

// 4. Build Movie Rows Dynamically 
async function createRow(title, fetchUrl) {
    try {
        const response = await fetch(fetchUrl);
        const data = await response.json();

        const row = document.createElement("div");
        row.className = "row";

        const rowTitle = document.createElement("h2");
        rowTitle.className = "row__title";
        rowTitle.innerText = title;
        row.appendChild(rowTitle);

        const rowPostersWrapper = document.createElement("div");
        rowPostersWrapper.className = "row__posters-wrapper";
        row.appendChild(rowPostersWrapper);

        const leftArrow = document.createElement("button");
        leftArrow.className = "row__arrow row__arrow--left";
        leftArrow.innerHTML = "&#10094;";
        rowPostersWrapper.appendChild(leftArrow);

        const rowPosters = document.createElement("div");
        rowPosters.className = "row__posters";
        rowPostersWrapper.appendChild(rowPosters);

        const rightArrow = document.createElement("button");
        rightArrow.className = "row__arrow row__arrow--right";
        rightArrow.innerHTML = "&#10095;";
        rowPostersWrapper.appendChild(rightArrow);

        data.results.forEach(movie => {
            if (movie.poster_path) {
                const poster = document.createElement("img");
                poster.className = "row__poster";
                poster.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
                poster.alt = movie.name || movie.title;
                
                poster.dataset.movieId = movie.id;

                poster.addEventListener("click", async () => {
                    const modal = document.getElementById("trailer-modal");
                    const videoContainer = document.getElementById("video-container");
                    const id = poster.dataset.movieId;
                    try {
                        // Trailer fetches routed safely through the proxy helper
                        let res = await fetch(getProxyUrl(`/movie/${id}/videos?api_key=${API_KEY}&language=en-US`));
                        let videoData = await res.json();
                        
                        if (!videoData.results || videoData.results.length === 0) {
                            res = await fetch(getProxyUrl(`/tv/${id}/videos?api_key=${API_KEY}&language=en-US`));
                            videoData = await res.json();
                        }                        
                        
                        const trailer = videoData.results.find(vid => vid.site === "YouTube" && (vid.type === "Trailer" || vid.type === "Teaser"));
                        if (trailer) {
                            videoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" allowfullscreen></iframe>`;
                        } else {
                            videoContainer.innerHTML = `<p style="color:white; text-align:center; padding: 40px;">Sorry, no trailer available for this title.</p>`;
                        }
                        if (modal) modal.style.display = "flex";
                    } catch (err) {
                        console.error("Error fetching trailer", err);
                    }
                });
                rowPosters.appendChild(poster);
            }
        });

        rightArrow.addEventListener("click", () => {
            rowPosters.scrollBy({ left: 500, behavior: "smooth" });
        });

        leftArrow.addEventListener("click", () => {
            rowPosters.scrollBy({ left: -500, behavior: "smooth" });
        });

        const rowsContainer = document.getElementById("rows_container");
        if (rowsContainer) {
            rowsContainer.appendChild(row);
        }

    } catch (error) {
        console.warn(`Skipped row "${title}" due to network timeout:`, error);
    }
}

// 5. Execute the engine for multiple categories
function loadDefaultRows() {
    const rowsContainer = document.getElementById("rows_container");
    if (rowsContainer) {
        rowsContainer.innerHTML = "";
        createRow("NETFLIX ORIGINALS", requests.fetchNetflixOriginals);
        createRow("Trending Now", requests.fetchTrending);
        createRow("Action Movies", requests.fetchActionMovies);
        createRow("Comedy Movies", requests.fetchComedyMovies);
        createRow("Horror Movies", requests.fetchHorrorMovies);
        createRow("Romance Movies", requests.fetchRomanceMovies);
        createRow("Documentaries", requests.fetchDocumentaries);
    }
}

loadDefaultRows();

// 6. Navbar scroll effect 
window.addEventListener("scroll", () => {
    const nav = document.getElementById("nav");
    if (nav) {
        if (window.scrollY > 100) {
            nav.classList.add("nav__black");
        } else {
            nav.classList.remove("nav__black");
        }
    }
});

// 7. Live search event listener
const searchInput = document.getElementById("search-input");
if (searchInput) {
    searchInput.addEventListener("input", async (e) => {
        const query = e.target.value.trim();
        const rowsContainer = document.getElementById("rows_container");

        if (query.length > 2 && rowsContainer) {
            rowsContainer.innerHTML = "";
            // Search fetches routed safely through the proxy helper
            createRow(`Search Results for "${query}"`, getProxyUrl(`/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`));
        } else if (query.length === 0) {
            loadDefaultRows();
        }
    });
}

// 8. Modal Close Handlers
const closeModalBtn = document.getElementById("close-modal");
if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        const modal = document.getElementById("trailer-modal");
        const videoContainer = document.getElementById("video-container");
        if (modal) modal.style.display = "none";
        if (videoContainer) videoContainer.innerHTML = ""; 
    });
}

window.addEventListener("click", (event) => {
    const modal = document.getElementById("trailer-modal");
    const videoContainer = document.getElementById("video-container");
    if (event.target === modal) {
        modal.style.display = "none";
        if (videoContainer) videoContainer.innerHTML = ""; 
    }
});
