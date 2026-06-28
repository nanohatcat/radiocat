document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('owot');
    const ctx = canvas.getContext('2d');
    const coordDisplay = document.getElementById('coord_display');
    const metadataDisplay = document.getElementById('metadata_display');
    let zoom = 1.0;
    let posX = 0;
    let posY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let tilesData = {};

    function init() {
        resize();
        window.addEventListener('resize', resize);
        try {
            if (window.opener && window.opener.document.getElementById('owot-json')) {
                const raw = window.opener.document.getElementById('owot-json').value.trim();
                tilesData = JSON.parse(raw).tiles || {};
            } else { alert("Data link lost. Make sure you opened this from the main page."); }
        } catch(e) { alert("Failed to parse JSON. Is the payload valid?"); }
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('mousedown', (e) => { isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY; });
        window.addEventListener('mouseup', () => isDragging = false);
        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") { canvas.width = 0; canvas.height = 0; } else { resize(); }
        });
        window.addEventListener("beforeunload", () => { tilesData = null; canvas.width = 0; canvas.height = 0; });
        requestAnimationFrame(render);
    }

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        requestAnimationFrame(render);
    }

    function handleWheel(e) {
        e.preventDefault();
        const zoomFactor = 1.1;
        const direction = e.deltaY < 0 ? 1 : -1;
        const oldZoom = zoom;
        if (direction > 0) zoom *= zoomFactor; else zoom /= zoomFactor;
        zoom = Math.max(0.1, Math.min(zoom, 10));
        const mouseX = e.clientX, mouseY = e.clientY - 28;
        posX = mouseX - (mouseX - posX) * (zoom / oldZoom);
        posY = mouseY - (mouseY - posY) * (zoom / oldZoom);
        requestAnimationFrame(render);
    }

    function handleMouseMove(e) {
        const mouseX = e.clientX, mouseY = e.clientY - 28;
        if (isDragging) { posX += (mouseX - dragStartX); posY += (mouseY - dragStartY); dragStartX = mouseX; dragStartY = mouseY; requestAnimationFrame(render); }
        updateMetadata(mouseX, mouseY);
    }

    function updateMetadata(mouseX, mouseY) {
        const worldX = (mouseX - posX - canvas.width / 2) / zoom;
        const worldY = (mouseY - posY - canvas.height / 2) / zoom;
        const charX = Math.floor(worldX / 10), charY = Math.floor(worldY / 18);
        const tX = Math.floor(charX / 16), tY = Math.floor(charY / 8);
        let inTX = charX - (tX * 16), inTY = charY - (tY * 8);
        coordDisplay.innerHTML = `<span class="highlight">X:</span> ${tX}, <span class="highlight">Y:</span> ${tY} <span style="color:#888; margin-left:10px;">[C: ${inTX}, ${inTY}]</span>`;
        const tileKey = `${tY},${tX}`;
        const tile = tilesData[tileKey];
        if (tile) {
            const idx = inTY * 16 + inTX;
            const contentChars = splitChars(tile.content || "");
            while(contentChars.length < 128) contentChars.push(" ");
            const char = contentChars[idx] || " ";
            const colors = tile.properties?.color || [];
            const bgcolors = tile.properties?.bgcolor || [];
            const charProts = tile.properties?.char || [];
            const fg = colors[idx] !== undefined && colors[idx] !== 0 ? "#" + colors[idx].toString(16).padStart(6, '0') : "Def";
            const bg = bgcolors[idx] !== undefined && bgcolors[idx] !== -1 ? "#" + bgcolors[idx].toString(16).padStart(6, '0') : "Def";
            let prot = charProts[idx];
            if (prot === undefined || prot === null) prot = tile.properties?.writability || 0;
            let protStr = "Public";
            if (prot === 1) protStr = "Member";
            if (prot === 2) protStr = "Owner";
            let charCode = char.codePointAt(0);
            let hexCode = charCode ? charCode.toString(16).toUpperCase() : "20";
            metadataDisplay.innerHTML = `Char: <span class="data-tag">'${char}'</span> (U+${hexCode}) | FG: <span class="data-tag">${fg}</span> | BG: <span class="data-tag">${bg}</span> | Prot: <span class="data-tag">${protStr}</span>`;
        } else { metadataDisplay.innerHTML = `Hovering over unloaded/empty space`; }
    }

    function splitChars(str) {
        var result = []; var len = str.length; var i = 0;
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
            var code = str.codePointAt(i); var char = String.fromCodePoint(code); var charLen = char.length; i += charLen;
            while (i < len) { var nextCode = str.codePointAt(i); if (isCombining(nextCode)) { var nextChar = String.fromCodePoint(nextCode); char += nextChar; i += nextChar.length; } else { break; } }
            result.push(char);
        }
        return result;
    }

    function clearCharTextDecorations(char) {
        var len = char.length; var decoCount = 0;
        for(var i = 0; i < len; i++) {
            var pos = len - 1 - i; var code = char.charCodeAt(pos);
            if(code >= 0x20F1 && code <= 0x2100) { decoCount++; } else { break; }
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

    const cw = 10, ch = 18, tw = 160, th = 144;

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const minScreenX = -tw * zoom, minScreenY = -th * zoom, maxScreenX = canvas.width + tw * zoom, maxScreenY = canvas.height + th * zoom;
        for (let key in tilesData) {
            const [tY, tX] = key.split(',').map(Number);
            const tile = tilesData[key];
            const screenX = (tX * tw) * zoom + posX + canvas.width / 2;
            const screenY = (tY * th) * zoom + posY + canvas.height / 2;
            if (screenX < minScreenX || screenY < minScreenY || screenX > maxScreenX || screenY > maxScreenY) continue;
            const scaleCW = cw * zoom, scaleCH = ch * zoom;
            let baseBgColor = '#ffffff';
            const writability = tile.properties?.writability ?? 0;
            if (writability === 1) baseBgColor = '#eeeeee';
            if (writability === 2) baseBgColor = '#dddddd';
            ctx.fillStyle = baseBgColor;
            ctx.fillRect(screenX, screenY, tw * zoom, th * zoom);

            const contentChars = splitChars(tile.content || "");
            while (contentChars.length < 128) contentChars.push(" ");
            const colors = tile.properties?.color || [];
            const bgcolors = tile.properties?.bgcolor || [];
            const charProts = tile.properties?.char;

            if (charProts) {
                for (let p = 0; p < 128; p++) {
                    if (charProts[p] !== null && charProts[p] !== undefined) {
                        const cellRow = Math.floor(p / 16), cellCol = p % 16;
                        let cellBg = baseBgColor;
                        if (charProts[p] === 0) cellBg = '#ffffff';
                        else if (charProts[p] === 1) cellBg = '#eeeeee';
                        else if (charProts[p] === 2) cellBg = '#dddddd';
                        ctx.fillStyle = cellBg;
                        ctx.fillRect(screenX + cellCol * scaleCW, screenY + cellRow * scaleCH, scaleCW, scaleCH);
                    }
                }
            }
            for (let idx = 0; idx < 128; idx++) {
                const cellRow = Math.floor(idx / 16), cellCol = idx % 16;
                const px = screenX + cellCol * scaleCW, py = screenY + cellRow * scaleCH;
                const bgInt = bgcolors[idx];
                if (bgInt !== undefined && bgInt !== null && bgInt !== -1) {
                    ctx.fillStyle = "#" + bgInt.toString(16).padStart(6, '0');
                    ctx.fillRect(px, py, scaleCW, scaleCH);
                }
                let char = contentChars[idx];
                if (!char || char === " ") continue;
                const fgInt = colors[idx];
                let fgColor = '#000000';
                if (fgInt !== undefined && fgInt !== null && fgInt !== 0) fgColor = "#" + fgInt.toString(16).padStart(6, '0');
                var deco = getCharTextDecorations(char);
                var isBold = deco && deco.bold;
                char = clearCharTextDecorations(char);
                ctx.fillStyle = fgColor;
                ctx.textAlign = "left";
                ctx.textBaseline = "alphabetic";
                ctx.font = `${isBold ? 'bold ' : ''}${14 * zoom}px "Courier New", Courier, monospace`;
                ctx.fillText(char, px, py + ((ch - 5) * zoom));
            }
        }
    }
    init();
});
