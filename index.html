<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Salesforce SOQL & REST</title>
<style>
body { margin:0; height:100vh; display:flex; flex-direction:column; font-family:sans-serif; }
#toolbar { display:flex; gap:10px; padding:8px; background:#e8e8e8; border-bottom:1px solid #ccc; }
#toolbar button { padding:6px 12px; background:#0066cc; color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px; }
#toolbar button:hover { background:#0052a3; }
#toolbar input[type="file"] { display:none; }
#top, #bottom { flex:1; overflow:hidden; }
#splitter { height:5px; background:#888; cursor:row-resize; }
textarea { width:100%; height:100%; resize:none; font-family:monospace; font-size:14px; box-sizing:border-box; padding:8px; overflow:auto; }
textarea::selection { background:#ffd700; color:#000; }
#log { padding:8px; font-family:monospace; font-size:14px; overflow:auto; flex:1; outline:none; }
#log:focus { box-shadow: inset 0 0 0 2px #0066cc; }
.log-line { padding:2px 0; border-bottom:1px solid #ccc; }
table { width:100%; border-collapse:collapse; margin-top:4px; font-family:monospace; font-size:14px; }
th, td { border:1px solid #ccc; padding:4px 8px; text-align:left; }
th { background:#eee; }
tr:nth-child(even) { background:#f9f9f9; }
tr:hover { background:#fffae6; }
.keyword { color:#d73a49; font-weight:bold; }

#results-header { display:flex; justify-content:flex-end; padding:4px 8px; border-bottom:1px solid #ccc; background:#f5f5f5; }
#copyResultsBtn { padding:4px 8px; font-size:12px; cursor:pointer; }
</style>
</head>
<body>
<div id="toolbar">
    <button onclick="saveSession()">💾 Save Session</button>
    <button onclick="document.getElementById('fileInput').click()">📂 Load Session</button>
    <input type="file" id="fileInput" accept=".json" onchange="loadSession(event)">
    
    <select id="envSelector" onchange="changeEnvironment()" style="margin-left:20px; padding:6px 12px; border-radius:4px; border:1px solid #ccc;">
        <option value="">Select Environment</option>
    </select>
    
    <span style="margin-left:auto; font-size:12px; color:#666;">Press Ctrl+E on a query block to execute SOQL or REST</span>
</div>

<div id="top" style="background:#f0f0f0;">
<textarea id="editor" placeholder="Type SOQL queries or REST paths here..."></textarea>
</div>
<div id="splitter"></div>
<div id="bottom" style="background:#fff; display:flex; flex-direction:column;">
    <div id="results-header">
        <button id="copyResultsBtn">📋 Copy Results</button>
    </div>
    <div id="log" tabindex="0">👉 Select an environment first, then press Ctrl+E on a block above to execute.</div>
</div>

<script>
// Highlight SOQL keywords
function highlightSOQL(query) {
    const keywords = /\b(SELECT|FROM|WHERE|LIMIT|ORDER BY|GROUP BY|AND|OR|NOT|NULL)\b/gi;
    return query.replace(keywords, '<span class="keyword">$1</span>');
}

// Environment functions
async function loadEnvironments() {
    if (!window.api?.listConfigs) return;
    const configs = await window.api.listConfigs();
    const selector = document.getElementById('envSelector');
    while (selector.children.length > 1) selector.removeChild(selector.lastChild);
    if (!configs.length) {
        const opt = document.createElement('option'); opt.textContent='No configs found'; opt.disabled=true; selector.appendChild(opt);
    } else {
        configs.forEach(c=>{ const opt=document.createElement('option'); opt.value=c; opt.textContent=c; selector.appendChild(opt); });
    }
}

async function changeEnvironment() {
    const sel=document.getElementById('envSelector'); if(!sel.value) return;
    try {
        const success = await window.api.setConfigFile(sel.value);
        if(success){
            log.innerHTML='';
            const msg = document.createElement('div');
            msg.className='log-line';
            msg.style.background="#d1ecf1"; msg.style.color="#0c5460"; msg.style.padding="5px";
            msg.textContent=`🔄 Switched to ${sel.value} environment`;
            log.appendChild(msg);
            document.title = `Salesforce SOQL & REST - ${sel.value}`;
        } else alert('Failed to switch environment');
    } catch(err){ alert(err.message); }
}

// Session save/load
function saveSession() {
    const blob=new Blob([JSON.stringify({queries:editor.value,timestamp:new Date().toISOString(),version:"1.0"},null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`soql-session-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`; a.click(); URL.revokeObjectURL(a.href);
}
function loadSession(e){
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=function(ev){
        try{
            const s=JSON.parse(ev.target.result);
            if(s.queries) editor.value=s.queries;
            log.innerHTML=''; const msg=document.createElement('div');
            msg.className='log-line'; msg.style.background="#d4edda"; msg.style.color="#155724"; msg.style.padding="5px";
            msg.textContent=`✅ Session loaded from ${s.timestamp ? new Date(s.timestamp).toLocaleString() : 'unknown date'}`;
            log.appendChild(msg);
        } catch(err){ alert(err.message); }
    }; reader.readAsText(file); e.target.value='';
}

// Splitter (fixed version using flex-basis)
const splitter = document.getElementById("splitter"),
      topDiv = document.getElementById("top"),
      bottomDiv = document.getElementById("bottom");

let isDragging = false;

splitter.addEventListener("mousedown", () => {
    isDragging = true;
    document.body.style.cursor = "row-resize";
    topDiv.style.flex = "none";
    bottomDiv.style.flex = "none";
});

document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    const offsetY = e.clientY;
    const toolbarHeight = document.getElementById("toolbar").offsetHeight;
    const totalHeight = window.innerHeight - toolbarHeight - splitter.offsetHeight;

    const topHeight = Math.max(50, offsetY - toolbarHeight);
    const bottomHeight = Math.max(50, totalHeight - (offsetY - toolbarHeight));

    topDiv.style.height = `${topHeight}px`;
    bottomDiv.style.height = `${bottomHeight}px`;
});

document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.cursor = "default";
});

const editor = document.getElementById("editor");
const log = document.getElementById("log");

// Copy button
document.getElementById('copyResultsBtn').addEventListener('click',()=>{ if(!log.innerText) return; navigator.clipboard.writeText(log.innerText).catch(err=>alert('❌ Failed to copy results')); });

// Ctrl+A in log - select all results content
log.addEventListener('keydown',e=>{ 
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){ 
        e.preventDefault(); 
        const r=document.createRange(); 
        r.selectNodeContents(log); 
        const s=window.getSelection(); 
        s.removeAllRanges(); 
        s.addRange(r); 
    } 
});

// Auto-focus log when clicked
log.addEventListener('click', () => log.focus());

// Ctrl+E handler supporting multi-line SOQL separated by blank lines
editor.addEventListener("keydown",async e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='e'){
        e.preventDefault(); if(!window.api){ alert("Error: API not loaded."); return; }

        const text = editor.value;
        const cursorPos = editor.selectionStart;

        // Find the block containing the cursor
        const lines = text.split('\n');
        let charPos = 0;
        let blockStart = -1;
        let blockEnd = -1;
        let blockLines = [];
        let inBlock = false;
        
        for(let i = 0; i < lines.length; i++){
            const line = lines[i];
            const lineStart = charPos;
            const lineEnd = charPos + line.length;
            
            if(line.trim() === ''){
                if(inBlock){
                    blockEnd = charPos - 1; // End before the empty line
                    if(cursorPos >= blockStart && cursorPos <= blockEnd) break;
                    blockStart = -1;
                    blockLines = [];
                    inBlock = false;
                }
            } else {
                if(!inBlock){
                    blockStart = lineStart;
                    inBlock = true;
                }
                blockLines.push(line);
                blockEnd = lineEnd;
            }
            charPos += line.length + 1; // +1 for newline
        }
        
        // Check if cursor is in the found block
        if(blockStart === -1 || cursorPos < blockStart || cursorPos > blockEnd){
            return;
        }
        
        const targetBlock = blockLines.map(l => l.trim()).join('\n').trim();
        if(!targetBlock) return;

        // Highlight the block being executed
        editor.setSelectionRange(blockStart, blockEnd);
        editor.focus();

        log.innerHTML='';
        document.body.style.cursor = 'wait';
        editor.style.cursor = 'wait';
        try{
            const soqlKeywords=/^(SELECT|UPDATE|DELETE|INSERT|UPSERT|MERGE)\b/i;
            if(soqlKeywords.test(targetBlock)){
                // Remove // and -- comments from SOQL
                const cleanedBlock = targetBlock.split('\n').map(l=>l.replace(/(\/\/|--).*/,'').trim()).join('\n').trim();
                const result = await window.api.executeSOQL(cleanedBlock);
                renderResult(result);
            } else {
                // Treat each non-empty line as a REST path
                const lines = targetBlock.split("\n").map(l=>l.trim()).filter(l=>l);
                for(const path of lines){
                    try{
                        // Remove // and -- comments from REST paths
                        const cleanedPath = path.replace(/(\/\/|--).*/,'').trim();
                        if(!cleanedPath) continue;
                        const res = await window.api.executeREST(cleanedPath);
                        renderResult(res);
                    } catch(err){
                        const errEl=document.createElement("div"); errEl.className="log-line";
                        errEl.innerHTML=`❌ ${err.message.replace(/\n/g,'<br>')}`;
                        log.appendChild(errEl);
                    }
                }
            }
        } catch(err){
            const errEl=document.createElement("div"); errEl.className="log-line";
            errEl.innerHTML=`❌ ${err.message.replace(/\n/g,'<br>')}`;
            log.appendChild(errEl);
        }
        document.body.style.cursor = 'default';
        editor.style.cursor = 'text';
        log.scrollTop = 0;
    }
});

// Render results helper
function renderResult(result) {
    if (result && result.totalSize !== undefined && (!result.records || result.records.length === 0)) {
        const tableEl = document.createElement("table");
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const th = document.createElement("th"); th.textContent = "COUNT";
        headerRow.appendChild(th); thead.appendChild(headerRow); tableEl.appendChild(thead);
        const tbody = document.createElement("tbody");
        const tr = document.createElement("tr"); const td = document.createElement("td");
        td.textContent = result.totalSize; tr.appendChild(td); tbody.appendChild(tr); tableEl.appendChild(tbody);
        log.appendChild(tableEl); return;
    }

    if (!result.records && !Array.isArray(result)) {
        const pre = document.createElement("pre");
        pre.textContent = JSON.stringify(result, null, 2);
        log.appendChild(pre);
        return;
    }

    const records = result.records || result;
    if (!records || records.length === 0) {
        const emptyEl = document.createElement("div");
        emptyEl.className = "log-line";
        emptyEl.textContent = "⚠️ No records returned.";
        log.appendChild(emptyEl);
        return;
    }

    const headers = Object.keys(records[0]).filter(h => h !== "attributes");
    if (headers.length === 0) {
        const emptyEl = document.createElement("div");
        emptyEl.className = "log-line";
        emptyEl.textContent = "⚠️ No fields to display.";
        log.appendChild(emptyEl);
        return;
    }

    const headerLabels = headers.map(h => (/^expr\d+$/i.test(h) && headers.length === 1) ? "COUNT" : h);
    const tableEl = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerLabels.forEach(lbl => { const th = document.createElement("th"); th.textContent = lbl; headerRow.appendChild(th); });
    thead.appendChild(headerRow); tableEl.appendChild(thead);

    const tbody = document.createElement("tbody");
    records.forEach(rec => {
        const tr = document.createElement("tr");
        headers.forEach(h => {
            const td = document.createElement("td");
            let val = rec[h];
            if (val === null || val === undefined) td.textContent = "";
            else if (typeof val === "object") {
                if (val.Id && (val.Name || val.name)) td.textContent = val.Name || val.name;
                else { try { td.textContent = JSON.stringify(val); } catch { td.textContent = String(val); } }
            } else td.textContent = String(val);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    tableEl.appendChild(tbody);
    log.appendChild(tableEl);
}

document.addEventListener('DOMContentLoaded',()=>{ if(window.api) loadEnvironments(); });
</script>
</body>
</html>
