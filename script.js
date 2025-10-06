// helper functions to avoid typing

const $ = (sel) => document.querySelector(sel);

// get elements from DOM

const entriesListEl = $("#entriesList");
const form = $("#entryForm");
const titleEl = $("#title");
const dateEl = $("#date");
const contentEl = $("#content");
const deleteBtn = $("#deleteBtn");
const deleteBtnRender = $("#deleteBtnRender");

const viewBtn = $("#previewBtn");
const editBtn = $("#editBtn");

const newEntryBtn = $("#newEntryBtn");
const saveBtn = $("#saveBtn");

const renderView = $("#renderView");
const editorView = $("#editorView");

const renderTitle = $("#renderTitle");
const renderDate = $("#renderDate");
const renderContent = $("#renderContent");

// create storage key to get and push things from local storage

const STORAGE_KEY = "codeJournalStorageKey2025";

// need a way to track globally what entry we are wanting to display 

let currentId = null;

// make some dummy data so we can see if things are working (an array of entries)

function uid() {
    return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toUpperCase();
}

function seedIfEmpty() {
    const entries = loadEntries();
    if (entries.length) return;
    const seeded = [
        {
            id: uid(),
            title: "Hello Journal!",
            date: new Date().toISOString().slice(0, 10),
            content: `### Markdown Guide. 
            A lightweight Markdown converter implemented with JavaScript. 
            - Headings # ## ### 
            - Unordered lists 
            - Fenced code blocks 
            - use triple back tickets and start on a new line (be sure not to have empty lines between you code) 
            - **Bold** with **text**, *italics* with *text* 
            - Links [text](https://example.com)`,
        },
        {
            id: uid(),
            title: "West Wing",
            date: new Date().toISOString().slice(0, 10),
            content: "testing the second",
        }
    ];
    saveEntries(seeded);
}

// create a uid function that will add a unique user id to each entry in order to get the one we want


function getFormData() {
    return {
        title: titleEl.value.trim(),
        date: dateEl.value,
        content: contentEl.value,
    };
}

// because we are using innerHTML in our renderView we need to prevent XSS attacks and escape HTML characters 
// https://stackoverflow.com/questions/30661497/xss-prevention-and-innerhtml

function escapeHTML (unsafe_str) {
    return unsafe_str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/\'/g, '&#39;')
      .replace(/\//g, '&#x2F;')
}

// I'm going to do the markdown to html converter now, arguably the hardest part 

function markdownToHtml(md) {
    if (!md) return "";

    // make new lines and white spaces with normalised new line
    md = String(md).replace(/\r\n?/g, "\n").trim();

    // escape raw HTML
    md = escapeHTML(md);

    // make triple backticks the indicator for a code block - replacing the ticks with the pre and code tags
    md = md.replace(/```([\w+-]+)?\n([\s\S]*?)```/g, (_, lang, code) => {
        const cls = lang ? `class="lang-${lang}"` : "";
        return `<pre><code${cls}>${code}</code></pre>`;
    });

    // Headings 
    md = md
        .replace(/^######\s+(.*)$/gm, "<h6>$1</h6>")
        .replace(/^#####\s+(.*)$/gm, "<h5>$1</h5>")
        .replace(/^####\s+(.*)$/gm, "<h4>$1</h4>")
        .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>")
        .replace(/^##\s+(.*)$/gm, "<h2>$1</h2>")
        .replace(/^#\s+(.*)$/gm, "<h1>$1</h1>")

    // Inline: bold, italics, links 
    md = md
        .replace(/(\*\*|__)(.+?)\1/g, "<strong>$2</strong>") 
        .replace(/(\*|_)([^*_]+)\1/g, "<em>$2</em>") 
    
    md = md 
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
        const safeUrl = url.replace(/"/g, "%22");
        return `<a href="${safeUrl}" target"_blank" rel="noopener noreferrer`;
        });
        
    //Paragraphs
    const blocks = md.split(/\n{2,}/).map(block => {
        const isHtmlBlock = /^<(h\d|pre|ul|ol|blockquote|hr)/i.test(block.trim());
        if(isHtmlBlock) return block;
        return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })

    return blocks.join("\n")
}

// lets do the onSave function first
// I need to make it so that onSave doesn't create a whole new entry each time and instead updates when the entry already exists

function onSave(e) {
    e.preventDefault();
    let { title, date, content } = getFormData();

    const entries = loadEntries();

    // currentId is our global variable that keeps a track of where we are on the page - if we are already on an entry currentId has been set
    // we then use this to find the index of the entry in our codeJournalStorageKey2025 array. If an array with this currentId exists we spread operator that object
    // and overwrite with the new values we have gotten from the form. If there isn't one, we push a new object into the array

    if(currentId) {
        const idx = entries.findIndex(e => e.id === currentId);
        if (idx !== -1) {
            entries[idx] = { ...entries[idx], title, date, content };
        }
    } else {
        entries.push({ id: uid(), title, date, content });
    }

    // save (to overwrite) and then rerender the page

    saveEntries(entries);
    renderEntries();

}


// function above is going to trigger when button is clicked but below is the function that actually does the saving to localStorage

function saveEntries(entries) {
    console.log("hey")
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    // renderEntries();
}

// so we managed to save to local storage, we now need a function to get from localStorage

function loadEntries() {
    try {
        const rawEntries = localStorage.getItem(STORAGE_KEY);
        return rawEntries ? JSON.parse(rawEntries) : []; 
    } catch {
        return [];
    }
}

// before doing the onSave function I'm going to get the entries that are already in localStorage to be rendered on the page

// we are rendering each entry and data-id="entry.id" because of li.dataset.id, so when we do the addEventListener and click on the entry later we immediately run the showEntry function

function renderEntries() {
    const entries = loadEntries();

    const frag = document.createDocumentFragment();
    entries.forEach(entry => {
        const li = document.createElement("li");
        li.dataset.id = entry.id;
        li.innerHTML = `
            <span class="title">${ escapeHTML(entry.title || "(Untitled)") }</span>
            <span class="date">${ entry.date }</span>
        `;
        li.addEventListener("click", () => showEntry(entry.id));
        frag.appendChild(li);
    });
    entriesListEl.innerHTML = "";
    entriesListEl.appendChild(frag)
}


// now need to get the correct entry to display on click using the uid 

function showEntry(id) {
    const entries = loadEntries();
    console.log(id);
    const entry = entries.find(e => e.id === id);
    currentId = id;
    // console.log(entry);
    console.log(entry.content)
    console.log(entry.title);

    renderTitle.textContent = entry.title || "(Untitled)";
    renderDate.textContent = entry.date;
    renderContent.innerHTML = markdownToHtml(entry.content);

    editorView.hidden = true;
    renderView.hidden = false;
    deleteBtnRender.hidden = false;

}

// foundations are okay now I can start creating functionality for the buttons - starting with the edit button

// basically we need to find a way to populate the form 

function populateForm(entry) {
    currentId = entry?.id ?? null;
    titleEl.value = entry?.title ?? "";
    dateEl.value = entry?.date ?? new Date().toISOString;
    contentEl.value = entry?.content ?? "";

    deleteBtn.hidden = !currentId;
    deleteBtnRender.hidden = true;

    editorView.hidden = false;
    renderView.hidden = true;
}

function openForEdit() {
    const entries = loadEntries();
    const entry = entries.find(e => e.id === currentId);
    if(!entry){
        editorView.hidden = false;
        renderView.hidden = true;
        return;
    };
    populateForm(entry);


}

// console.log(uid());

// create a save entry event listener so we can start clicking buttons and triggering functions

// now need to make a preview and a delete button, and a new entry button also

function onNew() {
    currentId = null;
    populateForm({ date: new Date().toISOString().slice(0, 10) });
    titleEl.focus();
}

function showPreview() {
    const { title, date, content } = getFormData();
    renderTitle.textContent = title || "Untitled";
    renderDate.textContent = date;
    renderContent.innerHTML = markdownToHtml(content);

    deleteBtnRender.hidden = false;

    editorView.hidden = true;
    renderView.hidden = false;
}

function onDelete() {
    if(!currentId) return;
    const ok = confirm("Delete this entry? This cannot be undone.");
    if(!ok) return;

    // filter out all of the entries whose id is not the currentId
    const entries = loadEntries().filter(e => e.id !== currentId);
    // use all of these entries (excluding the one whose id is currentId and overwrite the codeJournalStorageKey2025 array in localStorage)
    saveEntries(entries);
    // reset id and empty form
    currentId = null;
    populateForm({ });
    // rerender entries in the side bar
    renderEntries();
}



saveBtn.addEventListener("click", onSave);
editBtn.addEventListener("click", openForEdit);
newEntryBtn.addEventListener("click", onNew);
viewBtn.addEventListener("click", showPreview);
deleteBtnRender.addEventListener("click", onDelete);
deleteBtn.addEventListener("click", onDelete);


seedIfEmpty();
renderEntries();
populateForm({ });
