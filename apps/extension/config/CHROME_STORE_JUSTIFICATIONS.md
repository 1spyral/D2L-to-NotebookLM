# Chrome Web Store Permission Justifications

## Permissions

### `storage`

Used to persist user preferences (dark mode, custom NotebookLM URL), cache the fetched notebook list for instant display in the popup, and store the auto-selected notebook ID on D2L pages so returning users can quickly upload to the same notebook without re-selecting it.

### `activeTab`

Used to query the active tab's URL and title from the popup so the extension can detect whether the user is on a D2L course page and determine what content to save. Also used in the background to create, inspect, and send messages to NotebookLM tabs during the upload workflow.

### `scripting`

Used to programmatically inject content_notebooklm.js and notebooklm_page_upload.js into an open NotebookLM tab. These scripts drive the upload UI interaction on the NotebookLM page (creating a new notebook and uploading the course files).

## Host Permissions

### `https://notebooklm.google.com/*`

Required to inject content scripts into NotebookLM pages and interact with the NotebookLM interface to create notebooks and upload course materials extracted from D2L.

### `https://accounts.google.com/*`

Required to fetch the user's active Google account identity (via the ListAccounts endpoint) so the extension can authenticate requests made to the NotebookLM API on the user's behalf.

### `https://*/*` and `http://*/*`

Required to inject content scripts into D2L pages hosted on any domain, since educational institutions host their D2L (Brightspace) instances on custom domains that vary by school (e.g., `mycourses.university.edu`). The extension needs broad host access to detect and interact with D2L pages regardless of the institution's domain.
