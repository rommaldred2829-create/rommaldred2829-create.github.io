/* =========================================================
   Portfolio behavior - Romm Aldred L. Abaya
   1. Projects loaded from data/projects.json
   2. Latest GitHub repositories from the REST API
   3. Contact form validation
   4. Own feature: filter projects by technology
   ========================================================= */

// CHANGE THIS to your real GitHub username
const GITHUB_USERNAME = "rommaldred2829-create";

const projectList = document.getElementById("project-list");
const filterBar = document.getElementById("filter-bar");
const repoList = document.getElementById("repo-list");

let allProjects = [];

/* ---------- 1. Projects from JSON ---------- */
async function loadProjects() {
  try {
    const response = await fetch("data/projects.json");
    if (!response.ok) throw new Error("HTTP " + response.status);
    allProjects = await response.json();
    buildFilters(allProjects);
    renderProjects(allProjects);
  } catch (error) {
    console.warn("Projects could not be loaded:", error.message);
    projectList.innerHTML =
      '<p class="status error">Projects could not be loaded. Please try again later.</p>';
  }
}

function renderProjects(projects) {
  projectList.innerHTML = "";
  if (projects.length === 0) {
    projectList.innerHTML = '<p class="status">No projects use this technology yet.</p>';
    return;
  }
  projects.forEach(function (project) {
    const card = document.createElement("article");
    card.className = "glass project-card";

    const img = document.createElement("img");
    img.src = "images/" + project.screenshot;
    img.alt = "Screenshot of " + project.title;
    img.loading = "lazy";
    img.addEventListener("error", function () { img.style.display = "none"; });

    const body = document.createElement("div");
    body.className = "project-body";

    const title = document.createElement("h3");
    title.textContent = project.title;

    const desc = document.createElement("p");
    desc.textContent = project.description;

    const role = document.createElement("p");
    role.className = "project-role";
    role.textContent = "Role: " + project.role;

    const tech = document.createElement("ul");
    tech.className = "chips";
    project.technologies.forEach(function (t) {
      const li = document.createElement("li");
      li.textContent = t;
      tech.appendChild(li);
    });

    const link = document.createElement("a");
    link.className = "project-link";
    link.href = project.link;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "View on GitHub";

    body.append(title, desc, role, tech, link);
    card.append(img, body);
    projectList.appendChild(card);
  });
}

/* ---------- 4. Own feature: technology filter ---------- */
function buildFilters(projects) {
  const techs = new Set();
  projects.forEach(function (p) { p.technologies.forEach(function (t) { techs.add(t); }); });

  const names = ["All"].concat(Array.from(techs).sort());
  names.forEach(function (name) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-btn" + (name === "All" ? " active" : "");
    btn.textContent = name;
    btn.addEventListener("click", function () {
      filterBar.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      renderProjects(name === "All" ? allProjects : allProjects.filter(function (p) {
        return p.technologies.includes(name);
      }));
    });
    filterBar.appendChild(btn);
  });
}

/* ---------- 2. Latest GitHub repositories ---------- */
async function loadRepos() {
  const url = "https://api.github.com/users/" + GITHUB_USERNAME + "/repos?sort=updated&per_page=5";
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP " + response.status);
    const repos = await response.json();

    repoList.innerHTML = "";
    if (repos.length === 0) {
      repoList.innerHTML = '<li class="status">No public repositories yet.</li>';
      return;
    }
    repos.forEach(function (repo) {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = repo.html_url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = repo.name;

      const lang = document.createElement("span");
      lang.className = "repo-lang";
      lang.textContent = repo.language || "No language detected";

      li.append(link, lang);
      repoList.appendChild(li);
    });
  } catch (error) {
    console.warn("GitHub data unavailable:", error.message);
    repoList.innerHTML = '<li class="status error">GitHub data is unavailable right now. Please try again later.</li>';
  }
}

/* ---------- 3. Contact form ---------- */
const form = document.getElementById("contact-form");
const success = document.getElementById("form-success");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showError(field, message) {
  document.getElementById(field.id + "-error").textContent = message;
  field.classList.toggle("invalid", message !== "");
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  success.hidden = true;

  const name = form.elements.name;
  const email = form.elements.email;
  const message = form.elements.message;
  let valid = true;

  if (name.value.trim() === "") { showError(name, "Please enter your name."); valid = false; }
  else showError(name, "");

  if (email.value.trim() === "") { showError(email, "Please enter your email."); valid = false; }
  else if (!emailPattern.test(email.value.trim())) { showError(email, "Please enter a valid email address."); valid = false; }
  else showError(email, "");

  if (message.value.trim() === "") { showError(message, "Please enter a message."); valid = false; }
  else showError(message, "");

  if (!valid) return;

  // A static site has no back end, so the message is not actually sent.
  form.reset();
  success.hidden = false;
});

/* ---------- Start ---------- */
loadProjects();
loadRepos();
