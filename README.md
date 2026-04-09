# 🏰 Taverns & Castles

A browser-based medieval strategy and city-building game. Step into a procedurally generated world, establish your realm, manage resources, and build your kingdom from the ground up.

## ⚔️ Features

* **Procedural World Generation:** Infinite unique maps generated using Perlin Noise, featuring oceans, forests, and mountains.
* **Interactive Canvas:** Smooth drag-and-drop map navigation with scroll-wheel zooming.
* **Customizable Realms:** Configure your journey before it starts (Realm Name, Map Size, Difficulty, and Save Mode).
* **Immersive UI/UX:** Deep medieval aesthetics featuring the *MedievalSharp* font, dynamic particle effects, and procedural Web Audio API sound effects.
* **World Chronicle:** Persistent game settings (Music Volume, Particle Toggles, Fullscreen mode) saved locally in your browser.
* **No Server Required:** Fully client-side architecture using Vanilla JavaScript, HTML5 Canvas, and Session/Local Storage.

## 📜 Project Structure

* `/Main/` - The core game engine, canvas rendering, and building logic.
* `/Menu/` - The main entry point, visual menus, and World Chronicle settings.
* `/NewGame/` - Configuration screens for generating a new realm.
* `/Data/` - JSON files containing building stats and game data.
* `/Resources/` - Sprites, textures, and UI elements.

## 🗝️ How to Play

The game is designed to be played directly in the browser. 

**Play Online:**
Simply visit the [GitHub Pages link](https://matusbeke.github.io/TavernsAndCastles/) (Replace with your actual link once GitHub Pages is enabled).

**Play Locally:**
1. Clone the repository.
2. Open the `index.html` file in the root directory.
3. *Note: Since the game fetches JSON data, you may need to run a local live server (like VS Code Live Server) to bypass browser CORS restrictions if playing offline.*

## ✒️ Technologies Used

* **HTML5 Canvas** (Rendering)
* **Vanilla JavaScript** (Game logic, Web Audio API, Storage)
* **CSS3** (Animations, UI styling)
* **Perlin Noise** (Map generation algorithm)

---
*“May your taverns be full and your castles impenetrable.”* ✠
