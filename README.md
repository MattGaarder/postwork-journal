# Code Journal - Daily Coding Log

A web application that allows members to document their coding projects. Key features include support for Markdown formatting to allow users to document code snippets and explanations easily. Supports Markdown (headings, lists, inline code, bold/italic, links) and stores entries in **browser localStorage**. No backend and no external data libraries required.

--- 

## Features 

- Create, view, edit, and delete journal entries. 
- Markdown support: eadings, lists, inline code, bold/italic, links.
- Client-side storage only (localStorage).
- Preview mode for Markfown.
- Example entries pre-loacded on first run.

## Quick Start

- **Download** the project files (or close the repository).
- Open `index.html` in any modern browser.
- Click **"+ New Entry"**, write, then **Save**.

### Storage
- All data is stored under the key `codeJournalStorageKey2025` in `localStorage`.
- Shape of an entry: 
```
[
    {
        id: "ABC123",
        "title": "Hello Journal",
        "date": "2025-10-06",
        "content": "Markdown text"
    }
]
```

### Markdown Guide

A lightweight Markdown converter implemented with JavaScript.
- Headings `# ## ###`
- Unordered lists `-`
- Fenced code blocks - use triple back tickets and start on a new line (be sure not to have empty lines between you code)
- **Bold** with `**text**`, *italics* with `*text*` 
- Links `[text](https://example.com)`


