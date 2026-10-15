# Personal Student Portfolio (rommaldred2829-create.github.io)

Static portfolio: HTML + CSS + JavaScript, project data from `data/projects.json`,
live repositories from the GitHub REST API.

## Before you start
1. Rename this folder to `<your-github-username>.github.io`.
2. In `js/script.js` set `GITHUB_USERNAME`.
3. In `index.html` and `data/projects.json` replace `rommaldred2829-create` and the LinkedIn link, and add your school name and program to the About section.
4. Replace `images/profile.jpg` and the `project*.png` placeholders with real photos/screenshots (profile under 500 KB).

## Run locally
Open the folder in VS Code and click **Go Live** (http://127.0.0.1:5500).
Opening index.html directly from disk blocks the JSON request.

## Upload and deploy
```
git init
git add .
git commit -m "First version of my portfolio"
git branch -M main
git remote add origin https://github.com/rommaldred2829-create/rommaldred2829-create.github.io.git
git push -u origin main
```
Then: repository **Settings > Pages > Deploy from a branch > main / (root) > Save**.
Wait for the green check in **Actions**, open https://rommaldred2829-create.github.io, tick **Enforce HTTPS**.

## Update the live site
```
git add .
git commit -m "Describe what you changed"
git push
```
Refresh with Ctrl+F5.

## Network-tab checkpoint (fill in)
| Request | Method | Status | Response type |
|---|---|---|---|
| projects.json | GET | 200 | json |
| api.github.com/users/.../repos | GET | 200 | json |

## Three personal CSS changes (rubric B)
1. Mint-green accent with deep navy background (`--accent`, `--bg`)
2. Glassmorphism cards (`.glass`: blur + translucent border)
3. Sora headings paired with Source Sans 3 body text
