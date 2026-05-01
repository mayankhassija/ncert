# 📚 NCERT PDF Downloader
A modern, fast, and user-friendly web application to browse and download NCERT textbooks for Classes 1 to 12. 
<img width="1341" height="583" alt="screenshot" src="https://github.com/user-attachments/assets/923917b9-93aa-4c36-8e78-cb236a5cc5ed" />

## 🌐 Live Demo
Experience the app live here: **[NCERT PDF Downloader](https://mayankhassija.github.io/ncert/)**
---
## ✨ Key Features
- **🎯 Smart Search**: Instantly find books by title, subject, or class.
- **🔍 Advanced Filtering**: Filter the library by Class or Subject with a single click.
- **🔖 Bookmark System**: Save your favorite books to a personal list for quick access (persists across sessions).
- **🌓 View Modes**: Switch between **Grid** and **List** views to suit your browsing preference.
- **⚡ Quick Navigation**: Use the "Quick Jump" bar to instantly navigate between primary, middle, and secondary sections.
- **📥 Direct Downloads**: Download entire books as ZIP files or preview individual PDFs directly in your browser.
- **📱 Responsive Design**: Fully optimized for desktops, tablets, and mobile devices.
- **🎨 Premium UI**: Beautiful glassmorphism-inspired design with smooth animations and dark mode aesthetics.
---
## 🛠️ Tech Stack
- **Frontend**: HTML5, Vanilla CSS3 (Custom Properties, Flexbox, Grid)
- **Logic**: Vanilla JavaScript (ES6+, Fetch API, LocalStorage)
- **Data Source**: Custom `books.json` containing direct links to NCERT resources.
- **Typography**: [Sora](https://fonts.google.com/specimen/Sora) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono).
---
## 🚀 Getting Started
### Prerequisites
- A modern web browser
- A local development server (Live Server recommended)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/mayankhassija/NCERT-PDF-DOWNLOADER.git
   ```
2. Navigate to the project directory:
   ```bash
   cd NCERT-PDF-DOWNLOADER
   ```

### Running the Project
#### Option 1: Using Live Server (VS Code) - **Recommended**
1. Open the project folder in VS Code
2. Install the **Live Server** extension by Ritwick Dey (if not already installed)
3. Right-click on `index.html` and select **"Open with Live Server"**
4. The app will automatically open in your browser at `http://127.0.0.1:5500`

#### Option 2: Using Live Server (CLI)
1. Install Live Server globally:
   ```bash
   npm install -g live-server
   ```
2. Run Live Server in the project directory:
   ```bash
   live-server
   ```
3. The app will open automatically in your browser

#### Option 3: Using Python
If you have Python installed, you can use:
```bash
# Python 3
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

#### Option 4: Using Node.js HTTP Server
```bash
npx http-server
```

#### ⚠️ Important Note
Simply opening `index.html` directly in the browser (via `file://`) will **not work** due to CORS (Cross-Origin Resource Sharing) restrictions when loading the `books.json` file locally. You **must** use a local development server like Live Server, Python's HTTP server, or Node.js HTTP server for the application to function properly.

---
## 📂 Project Structure
- `index.html`: The main entry point and UI structure.
- `styles.css`: Custom CSS library for the premium design system.
- `script.js`: Core application logic, including filtering, searching, and bookmarks.
- `books.json`: The database of all available NCERT books.
- `ncert.png`: Site favicon and branding.
---
## 🤝 Contributing
Contributions are welcome! If you have suggestions for new features or improvements, feel free to:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
---
## 📜 License
Distributed under the MIT License.
---
*Note: This project is not officially affiliated with NCERT. All books are sourced from the official [NCERT website](https://ncert.nic.in).*
