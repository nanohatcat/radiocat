export const nabh_styles = {
    single:  { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│', ml: '├', mr: '┤', mt: '┬', mb: '┴', mm: '┼' },
    double:  { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', ml: '╠', mr: '╣', mt: '╦', mb: '╩', mm: '╬' },
    rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│', ml: '├', mr: '┤', mt: '┬', mb: '┴', mm: '┼' },
    dashed:  { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|', ml: '+', mr: '+', mt: '+', mb: '+', mm: '+' }
};

export const nabh = {
    getcharwidth: (element) => {
        const test = document.createElement('span');
        const computed = window.getComputedStyle(element);
        test.style.fontFamily = computed.fontFamily;
        test.style.fontSize = computed.fontSize;
        test.style.fontWeight = computed.fontWeight;
        test.style.letterSpacing = computed.letterSpacing;
        test.style.visibility = 'hidden';
        test.style.position = 'absolute';
        test.textContent = 'x';
        document.body.appendChild(test);
        const charwidth = test.getBoundingClientRect().width;
        document.body.removeChild(test);
        return charwidth || 8;
    },

    tokenizeparagraph: (line, contentwidth) => {
        let cleanline = line.replace(/\[(left|center|right)\]/g, '');
        let words = [];
        let currentword = '';
        let intag = false;
        for (let i = 0; i < cleanline.length; i++) {
            let char = cleanline[i];
            if (char === '<') intag = true;
            if (char === '>') intag = false;
            if (char === ' ' && !intag) {
                if (currentword) words.push(currentword);
                currentword = '';
            } else {
                currentword += char;
            }
        }
        if (currentword) words.push(currentword);
        let lines = [];
        let currentline = '';
        words.forEach(word => {
            let temp = document.createElement('div');
            let candidate = currentline + (currentline === '' ? '' : ' ') + word;
            temp.innerHTML = candidate;
            if (temp.textContent.length <= contentwidth) {
                currentline = candidate;
            } else {
                if (currentline !== '') {
                    lines.push(currentline);
                    currentline = word;
                } else {
                    lines.push(word);
                    currentline = '';
                }
            }
        });
        if (currentline !== '') lines.push(currentline);
        return lines;
    },

    drawbox: (element, htmlcontent, config = {}) => {
        const style = nabh_styles[config.style] || nabh_styles.single;
        const isjoined = config.isjoined;
        const padx = parseInt(isjoined ? (config.padx ?? 1) : (config.padx ?? 2), 10);
        const pady = parseInt(isjoined ? 0 : (config.pady ?? 0), 10);
        let parentwidth = element.parentElement.getBoundingClientRect().width;
        if (!parentwidth || parentwidth === 0) {
            const fallback = element.closest('.layout, .topbar-wrapper, .container') || document.body;
            parentwidth = fallback.getBoundingClientRect().width;
        }
        const charwidth = nabh.getcharwidth(element);
        let totalchars = Math.floor(parentwidth / charwidth) - 1;
        if (totalchars < 15) totalchars = 15;
        if (element.classList.contains('dynamic-toggle')) {
            let d = document.createElement('div');
            d.innerHTML = htmlcontent;
            totalchars = d.textContent.trim().length + (padx * 2) + 2;
        }
        const contentwidth = totalchars - (padx * 2) - 2;
        if (contentwidth <= 0) return htmlcontent;
        let sourcelines = htmlcontent.split('\n').map(l => l.trim());
        let processedlines = [];
        sourcelines.forEach(line => {
            if (line === '---') {
                processedlines.push({ text: '---', align: 'left' });
                return;
            }
            if (line === '') return;
            let align = 'center';
            if (line.startsWith('[center]')) align = 'center';
            else if (line.startsWith('[right]')) align = 'right';
            else if (line.startsWith('[left]')) align = 'left';
            let wrapped = nabh.tokenizeparagraph(line, contentwidth);
            wrapped.forEach(wl => {
                processedlines.push({ text: wl, align: align });
            });
        });
        if (processedlines.length > 0 && processedlines[0].text === '') processedlines.shift();
        if (processedlines.length > 0 && processedlines[processedlines.length - 1].text === '') processedlines.pop();
        let output = [];
        if (!config.jointop) {
            output.push(style.tl + style.h.repeat(totalchars - 2) + style.tr + '\n');
        } else {
            output.push(style.ml + style.h.repeat(totalchars - 2) + style.mr + '\n');
        }
        for (let i = 0; i < pady; i++) {
            output.push(style.v + ' '.repeat(totalchars - 2) + style.v + '\n');
        }
        processedlines.forEach(lineobj => {
            if (lineobj.text === '---') {
                output.push(style.v + ' '.repeat(padx) + style.h.repeat(contentwidth) + ' '.repeat(padx) + style.v + '\n');
            } else {
                let helper = document.createElement('div');
                helper.innerHTML = lineobj.text;
                const plainlength = helper.textContent.length;
                const totalsubspaces = contentwidth - plainlength;
                const spacesneeded = totalsubspaces >= 0 ? totalsubspaces : 0;
                let leftpad = 0;
                let rightpad = spacesneeded;
                if (lineobj.align === 'center') {
                    leftpad = Math.floor(spacesneeded / 2);
                    rightpad = spacesneeded - leftpad;
                } else if (lineobj.align === 'right') {
                    leftpad = spacesneeded;
                    rightpad = 0;
                }
                output.push(style.v + ' '.repeat(padx) + ' '.repeat(leftpad) + lineobj.text + ' '.repeat(rightpad) + ' '.repeat(padx) + style.v + '\n');
            }
        });
        for (let i = 0; i < pady; i++) {
            output.push(style.v + ' '.repeat(totalchars - 2) + style.v + '\n');
        }
        output.push(style.bl + style.h.repeat(totalchars - 2) + style.br);
        return output.join('');
    },

    renderwidgets: () => {
        document.querySelectorAll('.ascii-widget').forEach(widget => {
            if (!widget.hasAttribute('data-raw-content')) {
                let cleanmarkup = widget.innerHTML.replace(/^\s*[\r\n]/, '').replace(/[\r\n]\s*$/, '');
                widget.setAttribute('data-raw-content', cleanmarkup);
            }
            const rawcontent = widget.getAttribute('data-raw-content');
            const style = widget.getAttribute('data-box-style') || 'single';
            const padx = widget.getAttribute('data-pad-x');
            const pady = widget.getAttribute('data-pad-y');
            const hasjoinflag = widget.getAttribute('data-join') === 'true';
            const prevs = widget.previousElementSibling;
            const issequentialjoin = prevs && prevs.classList.contains('ascii-widget') &&
            widget.getAttribute('data-box-style') === prevs.getAttribute('data-box-style') &&
            widget.hasAttribute('data-join-group') &&
            widget.getAttribute('data-join-group') === prevs.getAttribute('data-join-group');
            const jointop = hasjoinflag || issequentialjoin;
            widget.innerHTML = nabh.drawbox(widget, rawcontent, {
                style, padx, pady, jointop,
                isjoined: (hasjoinflag || widget.hasAttribute('data-join-group'))
            });
        });
    },

    init: () => {
        nabh.renderwidgets();
        let timeout;
        window.addEventListener('resize', () => {
            clearTimeout(timeout);
            timeout = setTimeout(nabh.renderwidgets, 50);
        });
    }
};
