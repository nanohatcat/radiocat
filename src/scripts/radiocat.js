import { nabh } from './nabh.js';

document.addEventListener("DOMContentLoaded", () => {
    const themebtn = document.getElementById("theme-btn");
    let currenttheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", currenttheme);
    themebtn.setAttribute('data-raw-content', currenttheme === "dark" ? "switch to light mode" : "switch to dark mode");

    const tablinks = document.querySelectorAll("#topbar a");
    function activatetab(tabid) {
        const targetsection = document.getElementById("tab-" + tabid);
        if (!targetsection) return;

        const currentActive = document.querySelector('.tab-section.active-tab');
        if (currentActive && currentActive.id === 'tab-owot' && tabid !== 'owot') {
            const owotInput = document.getElementById('owot-json');
            const owotCanvas = document.getElementById('owot-canvas');
            const owotMeta = document.getElementById('owot-meta');
            if (owotInput) owotInput.value = '';
            if (owotCanvas) { owotCanvas.width = 0; owotCanvas.height = 0; }
            if (owotMeta) {
                owotMeta.textContent = 'no visual parsed yet, paste WS fetch and click render';
                owotMeta.style.color = 'var(--fg-dim)';
            }
        }

        document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active-tab'));
        tablinks.forEach(link => link.classList.remove('active'));
        targetsection.classList.add('active-tab');
        const activelink = Array.from(tablinks).find(link => link.getAttribute("href") === `#${tabid}`);
        if (activelink) activelink.classList.add('active');
        nabh.renderwidgets();
    }

    tablinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetid = link.getAttribute("href").replace("#", "");
            activatetab(targetid);
            history.pushState(null, null, `#${targetid}`);
        });
    });

    const initialhash = location.hash.replace("#", "") || "home";
    activatetab(initialhash);

    window.addEventListener("popstate", () => {
        const hash = location.hash.replace("#", "") || "home";
        activatetab(hash);
    });

    nabh.init();

    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    const pixelscale = 2.5;
    let width = canvas.width = Math.floor(window.innerWidth / pixelscale);
    let height = canvas.height = Math.floor(window.innerHeight / pixelscale);
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'.split('');
    const fontsize = 10;
    let columns = Math.floor(width / fontsize);
    let drops = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    function hextorgba(hex, alpha) {
        if (!hex) return `rgba(0,0,0,${alpha})`;
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    let matrixcolor = getComputedStyle(document.documentElement).getPropertyValue('--matrix-text').trim();
    let matrixbg = getComputedStyle(document.documentElement).getPropertyValue('--matrix-bg').trim();
    let fadebg = hextorgba(matrixbg, 0.12);
    let matrixTimer = null;
    let matrixActive = false;

    function drawmatrix() {
        ctx.fillStyle = fadebg;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = matrixcolor;
        ctx.font = fontsize + 'px monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontsize, drops[i] * fontsize);
            if (drops[i] * fontsize > height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }

    const asciiLogo = document.querySelector('.ascii-logo');
    if (asciiLogo) {
        asciiLogo.addEventListener('click', (e) => {
            if (e.detail === 3) {
                matrixActive = !matrixActive;
                if (matrixActive) matrixTimer = setInterval(drawmatrix, 60);
                else { clearInterval(matrixTimer); matrixTimer = null; ctx.clearRect(0, 0, width, height); }
            }
        });
    }

    window.addEventListener('resize', () => {
        width = canvas.width = Math.floor(window.innerWidth / pixelscale);
        height = canvas.height = Math.floor(window.innerHeight / pixelscale);
        columns = Math.floor(width / fontsize);
        drops = [];
        for (let x = 0; x < columns; x++) drops[x] = 1;
        if (!matrixActive) ctx.clearRect(0, 0, width, height);
    });

        themebtn.addEventListener("click", () => {
            let theme = document.documentElement.getAttribute("data-theme");
            let newtheme = theme === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", newtheme);
            currenttheme = newtheme;
            localStorage.setItem("theme", newtheme);
            themebtn.setAttribute('data-raw-content', newtheme === "dark" ? "switch to light mode" : "switch to dark mode");
            nabh.renderwidgets();
            setTimeout(() => {
                matrixcolor = getComputedStyle(document.documentElement).getPropertyValue('--matrix-text').trim();
                matrixbg = getComputedStyle(document.documentElement).getPropertyValue('--matrix-bg').trim();
                fadebg = hextorgba(matrixbg, 0.12);
            }, 50);
            if (owotCanvas && owotCanvas.width > 1 && owotInput.value.trim() !== "") owotRenderBtn.click();
        });

            const owotInput = document.getElementById('owot-json');
            const owotRenderBtn = document.getElementById('owot-render-btn');
            const owotDownloadBtn = document.getElementById('owot-download-btn');
            const owotUploadBtn = document.getElementById('owot-upload-btn');
            const owotViewerBtn = document.getElementById('owot-viewer-btn');
            const owotFileInput = document.getElementById('owot-file-input');
            const owotCanvas = document.getElementById('owot-canvas');
            const owotCtx = owotCanvas?.getContext('2d');
            const owotMeta = document.getElementById('owot-meta');

            const lcsShardCharVectors = [ [[0,3],[1,4],[0,4],[0,3]], [[0,3],[2,4],[0,4],[0,3]], [[0,1],[1,4],[0,4],[0,1]], [[0,1],[2,4],[0,4],[0,1]], [[0,0],[1,4],[0,4],[0,0]], [[1,0],[2,0],[2,4],[0,4],[0,1],[1,0]], [[2,0],[2,4],[0,4],[0,1],[2,0]], [[1,0],[2,0],[2,4],[0,4],[0,3],[1,0]], [[2,0],[2,4],[0,4],[0,3],[2,0]], [[1,0],[2,0],[2,4],[0,4],[1,0]], [[2,1],[2,4],[0,4],[0,3],[2,1]], [[2,3],[2,4],[1,4],[2,3]], [[2,3],[2,4],[0,4],[2,3]], [[2,1],[2,4],[1,4],[2,1]], [[2,1],[2,4],[0,4],[2,1]], [[2,0],[2,4],[1,4],[2,0]], [[0,0],[1,0],[2,1],[2,4],[0,4],[0,0]], [[0,0],[2,1],[2,4],[0,4],[0,0]], [[0,0],[1,0],[2,3],[2,4],[0,4],[0,0]], [[0,0],[2,3],[2,4],[0,4],[0,0]], [[0,0],[1,0],[2,4],[0,4],[0,0]], [[0,1],[2,3],[2,4],[0,4],[0,1]], [[0,0],[2,0],[2,4],[1,4],[0,3],[0,0]], [[0,0],[2,0],[2,4],[0,3],[0,0]], [[0,0],[2,0],[2,4],[1,4],[0,1],[0,0]], [[0,0],[2,0],[2,4],[0,1],[0,0]], [[0,0],[2,0],[2,4],[1,4],[0,0]], [[0,0],[1,0],[0,1],[0,0]], [[0,0],[2,0],[0,1],[0,0]], [[0,0],[1,0],[0,3],[0,0]], [[0,0],[2,0],[0,3],[0,0]], [[0,0],[1,0],[0,4],[0,0]], [[0,0],[2,0],[2,1],[0,3],[0,0]], [[0,0],[2,0],[2,3],[1,4],[0,4],[0,0]], [[0,0],[2,0],[2,3],[0,4],[0,0]], [[0,0],[2,0],[2,1],[1,4],[0,4],[0,0]], [[0,0],[2,0],[2,1],[0,4],[0,0]], [[0,0],[2,0],[1,4],[0,4],[0,0]], [[1,0],[2,0],[2,1],[1,0]], [[0,0],[2,0],[2,1],[0,0]], [[1,0],[2,0],[2,3],[1,0]], [[0,0],[2,0],[2,3],[0,0]], [[1,0],[2,0],[2,4],[1,0]], [[0,0],[2,0],[2,3],[0,1],[0,0]], [[0,0],[2,0],[2,4],[0,4],[1,2],[0,0]], [[0,0],[1,2],[2,0],[2,4],[0,4],[0,0]], [[0,0],[2,0],[1,2],[2,4],[0,4],[0,0]], [[0,0],[2,0],[2,4],[1,2],[0,4],[0,0]], [[0,0],[1,2],[0,4],[0,0]], [[0,0],[2,0],[1,2],[0,0]], [[2,0],[2,4],[1,2],[2,0]], [[1,2],[2,4],[0,4],[1,2]], [[0,0],[2,4],[0,4],[2,0],[0,0]], [[2,0],[2,4],[0,0],[0,4],[2,0]], [[2,0],[2,4],[0,4],[2,0]], [[0,0],[2,4],[0,4],[0,0]], [[0,0],[2,0],[0,4],[0,0]], [[0,0],[2,0],[2,4],[0,0]], [[1,0],[2,4],[0,4],[1,0]], [[0,0],[2,2],[0,4],[0,0]], [[0,0],[2,0],[1,4],[0,0]], [[2,0],[2,4],[0,2],[2,0]] ];
            const lcsOctantCharPoints = [ 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 81, 82, 83, 84, 86, 87, 88, 89, 91, 92, 93, 94, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 161, 162, 163, 164, 166, 167, 168, 169, 171, 172, 173, 174, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 241, 242, 243, 244, 246, 247, 248, 249, 251, 253, 254 ];
            const fracBlockTransforms = [ [[2, 4/8], [3, 1/8], [3, 2/8], [3, 3/8], [3, 4/8], [3, 5/8], [3, 6/8], [3, 7/8], [0, 8/8], [0, 7/8], [0, 6/8], [0, 5/8], [0, 4/8], [0, 3/8], [0, 2/8], [0, 1/8], [1, 4/8]], [[2, 1/8], [1, 1/8]], [[0, 1/8, 1/8], [0, 1/8, 2/8], [0, 1/8, 3/8], [0, 1/8, 4/8], [0, 1/8, 5/8], [0, 1/8, 6/8], [2, 1/8, 1/8], [2, 1/8, 2/8], [2, 1/8, 3/8], [2, 1/8, 4/8], [2, 1/8, 5/8], [2, 1/8, 6/8], ,,,,,, [2, 2/8], [2, 3/8], [2, 5/8], [2, 6/8], [2, 7/8], [1, 2/8], [1, 3/8], [1, 5/8], [1, 6/8], [1, 7/8]] ];

            function isValidSpecialSymbol(charCode) {
                if(charCode >= 0x2580 && charCode <= 0x2590) return true;
                if(charCode >= 0x2591 && charCode <= 0x2593) return true;
                if(charCode >= 0x2594 && charCode <= 0x259F) return true;
                if(charCode >= 0x25E2 && charCode <= 0x25E5) return true;
                if(charCode >= 0x1CD00 && charCode <= 0x1CDE5) return true;
                if(charCode >= 0x1FB00 && charCode <= 0x1FB3B) return true;
                if(charCode >= 0x1FB3C && charCode <= 0x1FB6F) return true;
                if(charCode >= 0x1FB70 && charCode <= 0x1FB7B) return true;
                if(charCode >= 0x1FB82 && charCode <= 0x1FB8B) return true;
                switch(charCode) { case 0x25B2: case 0x25BA: case 0x25BC: case 0x25C4: case 0x1CEA0: case 0x1CEA3: case 0x1CEA8: case 0x1CEAB: case 0x1FB9A: case 0x1FB9B: case 0x1FBE6: case 0x1FBE7: return true; }
                return false;
            }

            function isShardGridManipulable(charCode) {
                switch(charCode) { case 0x1FB3E: case 0x1FB3F: case 0x1FB43: case 0x1FB44: case 0x1FB49: case 0x1FB4A: case 0x1FB4E: case 0x1FB4F: case 0x1FB54: case 0x1FB55: case 0x1FB59: case 0x1FB5A: case 0x1FB5F: case 0x1FB60: case 0x1FB64: case 0x1FB65: return true; }
                return false;
            }

            function drawShadeChar(charCode, textRender, x, y, clampW, clampH) {
                let isLight = charCode === 0x2591;
                let factor = isLight ? 3 : 5;
                textRender.beginPath();
                for(let i = 0; i < factor; i++) {
                    for(let j = 0; j < 10; j++) {
                        textRender.rect(x + (i * clampW / factor) + (!(j%2)) * (clampW / (factor * 2)), y + j * clampH / 10, clampW / 10, clampH / 20);
                    }
                }
                if(charCode === 0x2593) { for(let j = 0; j < 10; j++) { textRender.rect(x, y + clampH / 20 + j * clampH / 10, clampW, clampH / 20); } }
                textRender.fill();
            }

            function draw2by2Char(charCode, textRender, x, y, width, height) {
                var pattern = [2, 1, 8, 11, 9, 14, 13, 4, 6, 7][charCode - 0x2596];
                textRender.beginPath();
                if(pattern & 8) textRender.rect(x, y, width / 2, height / 2);
                if(pattern & 4) textRender.rect(x + width / 2, y, width / 2, height / 2);
                if(pattern & 2) textRender.rect(x, y + height / 2, width / 2, height / 2);
                if(pattern & 1) textRender.rect(x + width / 2, y + height / 2, width / 2, height / 2);
                textRender.fill();
            }

            function draw2by3Char(charCode, textRender, x, y, width, height) {
                var code = 0;
                if(charCode >= 0x1FB00 && charCode <= 0x1FB13) code = charCode - 0x1FB00 + 1;
                if(charCode >= 0x1FB14 && charCode <= 0x1FB27) code = charCode - 0x1FB00 + 2;
                if(charCode >= 0x1FB28 && charCode <= 0x1FB3B) code = charCode - 0x1FB00 + 3;
                textRender.beginPath();
                for(var py = 0; py < 3; py++) {
                    var idx = py * 2;
                    if(code >> idx & 1) { if (code >> idx & 2) textRender.rect(x, y + py * (height / 3), width, height / 3); else textRender.rect(x, y + py * (height / 3), width / 2, height / 3); }
                    else if (code >> idx & 2) textRender.rect(x + (width / 2), y + py * (height / 3), width / 2, height / 3);
                }
                textRender.fill();
            }

            function drawTriangleShardChar(charCode, textRender, x, y, width, height, altGrid) {
                var is90degTri = charCode >= 0x25E2 && charCode <= 0x25E5;
                var isIsoTri = charCode === 0x25B2 || charCode === 0x25BA || charCode === 0x25BC || charCode === 0x25C4;
                var vecIndex = charCode - 0x1FB3C;
                if(charCode >= 0x1FB9A && charCode <= 0x1FB9B) vecIndex -= 42;
                else if(is90degTri) vecIndex = (charCode - 0x25E2) + 54;
                else if(isIsoTri) {
                    switch(charCode) { case 0x25B2: vecIndex = 58; break; case 0x25BA: vecIndex = 59; break; case 0x25BC: vecIndex = 60; break; case 0x25C4: vecIndex = 61; break; }
                }
                var vecs = lcsShardCharVectors[vecIndex];
                if (!vecs) return;
                var gpX = [0, width / 2, width];
                var gpY = [0, height / 3, height / 2, (height / 3) * 2, height];
                if(altGrid) {
                    if(isShardGridManipulable(charCode)) gpY = [0, height / 2, height / 2, height / 2, height];
                    switch(charCode) { case 0x1FB68: gpX[1] = width; break; case 0x1FB69: gpY[1] = gpY[2] = height; break; case 0x1FB6A: gpX[1] = 0; break; case 0x1FB6B: gpY[1] = gpY[2] = 0; break; }
                }
                textRender.beginPath();
                for(var i = 0; i < vecs.length; i++) {
                    var vec = vecs[i];
                    var gx = gpX[vec[0]];
                    var gy = gpY[vec[1]];
                    if(i === 0) textRender.moveTo(x + gx, y + gy);
                    else textRender.lineTo(x + gx, y + gy);
                }
                textRender.closePath();
                textRender.fill();
            }

            function draw2by4Char(charCode, textRender, x, y, width, height) {
                var code = 0;
                if(charCode >= 0x1CD00 && charCode <= 0x1CDE5) code = lcsOctantCharPoints[charCode - 0x1CD00];
                else {
                    switch(charCode) { case 0x1CEA8: code = 1; break; case 0x1CEAB: code = 2; break; case 0x1CEA3: code = 64; break; case 0x1CEA0: code = 128; break; case 0x1FBE6: code = 20; break; case 0x1FBE7: code = 40; break; }
                }
                if(!code) return false;
                textRender.beginPath();
                for(var py = 0; py < 4; py++) {
                    var idx = py * 2;
                    if(code >> idx & 1) { if (code >> idx & 2) textRender.rect(x, y + py * (height / 4), width, height / 4); else textRender.rect(x, y + py * (height / 4), width / 2, height / 4); }
                    else if (code >> idx & 2) textRender.rect(x + (width / 2), y + py * (height / 4), width / 2, height / 4);
                }
                textRender.fill();
            }

            function drawFractionalBlockChar(charCode, textRender, x, y, width, height) {
                var transform = null;
                if(charCode >= 0x2580 && charCode <= 0x2590) transform = fracBlockTransforms[0][charCode - 0x2580];
                else if(charCode >= 0x2594 && charCode <= 0x2595) transform = fracBlockTransforms[1][charCode - 0x2594];
                else if(charCode >= 0x1FB70 && charCode <= 0x1FB8B) transform = fracBlockTransforms[2][charCode - 0x1FB70];
                if(!transform) return;
                var dir = transform[0];
                var frac = transform[1];
                var offset = transform[2] || 0;
                var x2 = x + width - 1;
                var y2 = y + height - 1;
                switch(dir) {
                    case 0: x2 -= width - (width * (frac+offset)); x += width * offset; break;
                    case 1: x += width - (width * (frac+offset)); x2 -= width * offset; break;
                    case 2: y2 -= height - (height * (frac+offset)); y += height * offset; break;
                    case 3: y += height - (height * (frac+offset)); y2 -= height * offset; break;
                }
                textRender.fillRect(x, y, x2 - x + 1, y2 - y + 1);
            }

            function drawBlockChar(charCode, textRender, x, y, cellW, cellH, altGrid) {
                var isShade = charCode >= 0x2591 && charCode <= 0x2593;
                var isFractionalBlock = (charCode >= 0x2580 && charCode <= 0x2590) || (charCode >= 0x2594 && charCode <= 0x2595) || (charCode >= 0x1FB70 && charCode <= 0x1FB7B) || (charCode >= 0x1FB82 && charCode <= 0x1FB8B);
                var is2by2 = charCode >= 0x2596 && charCode <= 0x259F;
                var is2by3 = charCode >= 0x1FB00 && charCode <= 0x1FB3B;
                var is2by4 = (charCode >= 0x1CD00 && charCode <= 0x1CDE5) || charCode == 0x1CEA8 || charCode == 0x1CEAB || charCode == 0x1CEA3 || charCode == 0x1CEA0 || charCode == 0x1FBE6 || charCode == 0x1FBE7;
                var is90degTri = charCode >= 0x25E2 && charCode <= 0x25E5;
                var isIsoTri = charCode == 0x25B2 || charCode == 0x25BA || charCode == 0x25BC || charCode == 0x25C4;
                var isTriangleShard = (charCode >= 0x1FB3C && charCode <= 0x1FB6F) || (charCode >= 0x1FB9A && charCode <= 0x1FB9B) || (is90degTri || isIsoTri);

                if(isFractionalBlock) drawFractionalBlockChar(charCode, textRender, x, y, cellW, cellH);
                else if(is2by2) draw2by2Char(charCode, textRender, x, y, cellW, cellH);
                else if(is2by3) draw2by3Char(charCode, textRender, x, y, cellW, cellH);
                else if(isTriangleShard) drawTriangleShardChar(charCode, textRender, x, y, cellW, cellH, altGrid);
                else if(is2by4) draw2by4Char(charCode, textRender, x, y, cellW, cellH);
                else if(isShade) drawShadeChar(charCode, textRender, x, y, cellW, cellH);
            }

            function clearCharTextDecorations(char) {
                var len = char.length;
                var decoCount = 0;
                for(var i = 0; i < len; i++) {
                    var pos = len - 1 - i;
                    var code = char.charCodeAt(pos);
                    if(code >= 0x20F1 && code <= 0x2100) decoCount++; else break;
                }
                if(decoCount > 0) return char.slice(0, len - decoCount);
                return char;
            }

            function getCharTextDecorations(char) {
                var code = char.charCodeAt(char.length - 1);
                code -= 0x20F0;
                if(code <= 0 || code > 16) return null;
                return { bold: code >> 3 & 1, italic: code >> 2 & 1, under: code >> 1 & 1, strike: code & 1 };
            }

            function split(str) {
                var result = [];
                var len = str.length;
                var i = 0;
                function isCombining(code) {
                    if (code >= 0x0300 && code <= 0x036F) return true;
                    if (code >= 0x1DC0 && code <= 0x1DFF) return true;
                    if (code >= 0x20D0 && code <= 0x2100) return true;
                    if (code >= 0xFE20 && code <= 0xFE2F) return true;
                    if (code >= 0xFE00 && code <= 0xFE0F) return true;
                    if (code >= 0xE0100 && code <= 0xE01EF) return true;
                    if (code === 0x200C || code === 0x200D) return true;
                    if (code >= 0x1F3FB && code <= 0x1F3FF) return true;
                    return false;
                }
                while (i < len) {
                    var code = str.codePointAt(i);
                    var char = String.fromCodePoint(code);
                    var charLen = char.length;
                    i += charLen;
                    while (i < len) {
                        var nextCode = str.codePointAt(i);
                        if (isCombining(nextCode)) { var nextChar = String.fromCodePoint(nextCode); char += nextChar; i += nextChar.length; } else break;
                    }
                    result.push(char);
                }
                return result;
            }

            if (owotRenderBtn && owotCanvas) {
                owotRenderBtn.addEventListener('click', () => {
                    try {
                        const rawData = JSON.parse(owotInput.value.trim());
                        const tiles = rawData.tiles;
                        if (!tiles || typeof tiles !== 'object') throw new Error("JSON parsed, but no valid 'tiles' key.");
                        const keys = Object.keys(tiles);
                        if (keys.length === 0) throw new Error("The parsed tiles database is empty.");

                        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                        keys.forEach(key => {
                            const [y, x] = key.split(',').map(Number);
                            if (x < minX) minX = x; if (x > maxX) maxX = x;
                            if (y < minY) minY = y; if (y > maxY) maxY = y;
                        });

                            const cellWidth = 10, cellHeight = 18, scale = 2;
                            const tileCols = maxX - minX + 1, tileRows = maxY - minY + 1;
                            const globalCols = tileCols * 16, globalRows = tileRows * 8;

                            owotCanvas.width = globalCols * cellWidth * scale;
                            owotCanvas.height = globalRows * cellHeight * scale;

                            const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
                            owotCtx.fillStyle = currentTheme === 'dark' ? '#141b1e' : '#dadada';
                            owotCtx.fillRect(0, 0, owotCanvas.width, owotCanvas.height);

                            for (let key in tiles) {
                                const [tileY, tileX] = key.split(',').map(Number);
                                const tile = tiles[key];
                                const contentChars = split(tile.content || "");
                                while (contentChars.length < 128) contentChars.push(" ");
                                const colors = tile.properties?.color || [];
                                const bgcolors = tile.properties?.bgcolor || [];

                                let tileBgColor = currentTheme === 'dark' ? '#141b1e' : '#dadada';
                                const writability = tile.properties?.writability ?? 0;
                                if (writability === 1) tileBgColor = currentTheme === 'dark' ? '#111111' : '#eeeeee';
                                else if (writability === 2) tileBgColor = currentTheme === 'dark' ? '#222222' : '#dddddd';

                                owotCtx.fillStyle = tileBgColor;
                                owotCtx.fillRect((tileX - minX) * 16 * cellWidth * scale, (tileY - minY) * 8 * cellHeight * scale, 16 * cellWidth * scale, 8 * cellHeight * scale);

                                const charProts = tile.properties?.char;
                                if (charProts) {
                                    for (let p = 0; p < 128; p++) {
                                        const code = charProts[p];
                                        if (code !== null && code !== undefined) {
                                            const cRow = Math.floor(p / 16);
                                            const cCol = p % 16;
                                            const px = ((tileX - minX) * 16 + cCol) * cellWidth * scale;
                                            const py = ((tileY - minY) * 8 + cRow) * cellHeight * scale;
                                            let cellBg = tileBgColor;
                                            if (code === 0) cellBg = currentTheme === 'dark' ? '#141b1e' : '#dadada';
                                            else if (code === 1) cellBg = currentTheme === 'dark' ? '#111111' : '#eeeeee';
                                            else if (code === 2) cellBg = currentTheme === 'dark' ? '#222222' : '#dddddd';
                                            owotCtx.fillStyle = cellBg;
                                            owotCtx.fillRect(px, py, cellWidth * scale, cellHeight * scale);
                                        }
                                    }
                                }

                                for (let idx = 0; idx < 128; idx++) {
                                    const cellRow = Math.floor(idx / 16), cellCol = idx % 16;
                                    let char = contentChars[idx] || " ";
                                    const px = ((tileX - minX) * 16 + cellCol) * cellWidth * scale;
                                    const py = ((tileY - minY) * 8 + cellRow) * cellHeight * scale;

                                    const bgInt = bgcolors[idx];
                                    if (bgInt !== undefined && bgInt !== null && bgInt !== -1) {
                                        owotCtx.fillStyle = "#" + bgInt.toString(16).padStart(6, '0');
                                        owotCtx.fillRect(px, py, cellWidth * scale, cellHeight * scale);
                                    }

                                    const fgInt = colors[idx];
                                    let fgColor = currentTheme === 'dark' ? '#dadada' : '#141b1e';
                                    if (fgInt !== undefined && fgInt !== null && fgInt !== 0) {
                                        fgColor = "#" + fgInt.toString(16).padStart(6, '0');
                                    }

                                    var deco = getCharTextDecorations(char);
                                    var isBold = deco && deco.bold;
                                    char = clearCharTextDecorations(char);
                                    const cCode = char.codePointAt(0);

                                    if (isValidSpecialSymbol(cCode)) {
                                        drawBlockChar(cCode, owotCtx, px, py, cellWidth * scale, cellHeight * scale, isBold);
                                    } else if (char !== " ") {
                                        let textYOffset = (cellHeight - 5) * scale;
                                        owotCtx.fillStyle = fgColor;
                                        owotCtx.textAlign = "left";
                                        owotCtx.textBaseline = "alphabetic";
                                        owotCtx.font = `${isBold ? 'bold ' : ''}${14 * scale}px "Courier New", Courier, monospace`;
                                        owotCtx.fillText(char, px, py + textYOffset);
                                    }
                                }
                            }
                            owotMeta.textContent = `successfully parsed grid boundaries: X(${minX} to ${maxX}), Y(${minY} to ${maxY}) | size: ${owotCanvas.width}x${owotCanvas.height}px`;
                            owotMeta.style.color = 'var(--accent-hover)';
                    } catch (err) {
                        owotMeta.textContent = `Error parsing layout: ${err.message}`;
                        owotMeta.style.color = '#e57474';
                    }
                });
            }

            if (owotUploadBtn && owotFileInput) {
                owotUploadBtn.addEventListener('click', () => owotFileInput.click());
                owotFileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => { owotInput.value = evt.target.result; owotRenderBtn.click(); };
                    reader.readAsText(file);
                });
            }

            if (owotDownloadBtn && owotCanvas) {
                owotDownloadBtn.addEventListener('click', () => {
                    if (owotCanvas.width <= 1) { alert("Nothing parsed to export yet. Input a valid tiles JSON payload and render first."); return; }
                    const link = document.createElement('a');
                    link.download = 'owot-raster-render.png';
                    link.href = owotCanvas.toDataURL('image/png');
                    link.click();
                });
            }

            if (owotViewerBtn && owotInput) {
                owotViewerBtn.addEventListener('click', () => {
                    if (owotInput.value.trim() === "") { alert("Please paste your valid JSON WS tile payload first."); return; }
                    window.open('/viewer', '_blank'); // Astro resolves this to src/pages/viewer.astro
                });
            }
});
