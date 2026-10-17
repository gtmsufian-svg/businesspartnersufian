SUFIAN PORTFOLIO - how to use
=============================

FOLDER STRUCTURE
sufian-portfolio/
  index.html      Home
  about.html      About
  skills.html     Skills (tree with skills on leaves)
  projects.html   Projects (demo cards)
  services.html   Services
  contact.html    Contact
  css/style.css   All styles
  js/data.js      ALL your text content (edit this file to change content)
  js/weather.js   Sky: clouds, sun, rain, rainbow, birds, falling leaves
  js/sound.js     Rain, wind and bird sound (made in the browser, no files)
  js/main.js      Menu, footer, skills tree, contact form
  images/         Put sufian.jpg here (your photo)

RUN
1. Unzip the folder.
2. Double-click index.html (opens in your browser).
   Or in VS Code: install "Live Server", right-click index.html, Open with Live Server.
3. Click the "Sound off" button (bottom right) to turn on rain, wind and bird sound.

ADD YOUR PHOTO
Your photo is already at images/sufian.jpg. To change it, replace that file.

EDIT CONTENT (js/data.js)
- social: paste GitHub, LinkedIn, Facebook, Instagram, WhatsApp links
- resume: set a PDF path (for example "docs/resume.pdf"); the button appears automatically
- projects: change title, description, image, link, review, reviewer
- skills / services: edit the text

DEPLOY FREE (Vercel)
1. Upload the sufian-portfolio folder to a GitHub repository.
2. On vercel.com choose "Add New Project", import the repository, click Deploy.
   No build command is needed (static site).

WEATHER
Cloudy sky -> lightning flashes (with thunder if sound is on) -> rain -> sun and rainbow.

EMAIL
The email link and the "Send by Gmail" button open a Gmail compose window in a new tab.

SKILLS PAGE
Click a leaf: it splits into two halves and the skill details open between them.
Click the x, the leaf again, the empty tree, or press Esc to close.

YELLOW HIGHLIGHT
Wrap any important words in <mark class="mark">...</mark> inside the HTML pages.

VERCEL / GITHUB NOTE
index.html must be at the TOP LEVEL of the repository (not inside a folder).
Upload the files from inside this folder: index.html, css, js, images, favicon.svg, the other pages.
