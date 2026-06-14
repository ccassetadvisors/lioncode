/* Assemble a single self-contained preview.html from the project parts.
   CSS + all six JS files are inlined; three.js and Google Fonts stay on their
   CDNs (they load when the file is opened in a browser with internet). */
const fs = require("fs");
const read = (p) => fs.readFileSync(p, "utf8");
// Neutralize any literal </script> inside inlined JS so it can't close the tag.
const safe = (js) => js.replace(/<\/script>/gi, "<\\/script>");

const css = ["assets/site.css", "assets/sections.css", "assets/overlay.css"].map(read).join("\n");
const js = ["js/image-slot.js", "js/content.js", "js/site.js", "js/scene-lib.js", "js/three-scenes.js", "js/app.js", "js/router.js"]
  .map((p) => `\n/* ===== ${p} ===== */\n` + read(p)).map(safe).join("\n");

let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>C&amp;C Asset Advisors — preview</title>
  <meta name="theme-color" content="#15130F">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Hanken+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">

  <!-- three.js from CDN (needs internet on first open) -->
  <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>

  <style>
${css}
  </style>
</head>
<body>
  <div id="poster"></div>
  <canvas id="world"></canvas>

  <nav class="nav" id="nav"></nav>
  <main class="page" id="page"></main>
  <div class="ov" id="overlay"></div>

  <div class="boot" id="boot"><div class="m">C<i>&amp;</i>C</div></div>

  <script>
${js}
  </script>

  <script>
    // Lift boot splash once the world has rendered (or after a timeout).
    (function () {
      var done = false;
      function lift() {
        if (done) return; done = true;
        var b = document.getElementById("boot");
        if (b) { b.classList.add("gone"); setTimeout(function () { b.remove(); }, 850); }
      }
      var tries = 0;
      (function check() {
        var w = window.CCWorld && window.CCWorld.instance;
        if ((w && w.frames > 0) || tries > 40) lift();
        else { tries++; setTimeout(check, 60); }
      })();
      window.addEventListener("load", function () { setTimeout(lift, 1400); });
    })();
  </script>
</body>
</html>
`;

// Embed referenced media as data URIs so the standalone file works from any folder.
const VIDEO = "assets/video/reunion-tower.mp4";
if (fs.existsSync(VIDEO)) {
  const dataUri = "data:video/mp4;base64," + fs.readFileSync(VIDEO).toString("base64");
  html = html.split('src="' + VIDEO + '"').join('src="' + dataUri + '"');
}

fs.writeFileSync("preview.html", html);
console.log("wrote preview.html — " + (html.length / 1024 / 1024).toFixed(1) + " MB");
