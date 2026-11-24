# A Rose for Someone Special

A responsive, cinematic 3D rose-gold bloom experience. The rose, orbital rings, leaves and gold dust are rendered in Three.js. The visitor-provided MP3 `assets/judaa-hum-ho-gaye.mp3` plays in a loop after the visitor taps **TAP TO OPEN**. The MUSIC ON/OFF control pauses and resumes playback.

## Run locally
Because this project uses JavaScript modules, serve the folder over HTTP rather than opening `index.html` as a `file://` URL.

```bash
cd rose-gold-bloom
python -m http.server 8000
```

Open http://localhost:8000

## Publish a public share link
1. Create a new public repository on GitHub and upload `index.html`, `styles.css`, and `main.js`.
2. In the repository, open **Settings → Pages**.
3. Set the source to **Deploy from a branch**, choose `main` and `/ (root)`, then save.
4. GitHub Pages will provide a public URL. Share that URL through WhatsApp, Instagram, or any messaging app.

Alternative: drag the project folder into a static hosting service such as Netlify Drop or Cloudflare Pages.

## Notes
- Three.js is loaded from jsDelivr, and the optional typography is loaded from Google Fonts; an internet connection is needed for those CDN resources.
- The supplied MP3 starts only after the visitor's tap, in line with mobile browser autoplay policies. Keep the MP3 in `assets/` when deploying.
- The visual bloom is procedural 3D geometry with layered curved petals, metallic edging, stem, leaves, three orbital rings and animated particles.
- The renderer caps device pixel ratio for better mobile performance and responds to viewport resizing.
- For a production deployment, serve over HTTPS (GitHub Pages and Netlify do this automatically).
