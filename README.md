# CampusAssist Advanced — RAG-style Student Assistant

## What is implemented
- Responsive student-assistant web interface.
- Flask backend with JSON API endpoints.
- TF-IDF + cosine-similarity retrieval over a local knowledge base.
- Top-3 matching passages and source metadata.
- PDF/TXT upload, text extraction, chunking with overlap, and indexing.
- Document listing and removal.
- Greeting/thanks handling and fallback when no relevant answer is found.

## Run on Windows
```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000

If PowerShell blocks activation:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## How the retrieval pipeline works
1. A user submits a question in the browser.
2. JavaScript sends it to Flask at `/api/chat` as JSON.
3. Flask normalizes and vectorizes the question using the fitted TF-IDF vectorizer.
4. Cosine similarity compares the question vector against the indexed knowledge chunks.
5. The best matching passages are selected and returned with source information.
6. The browser renders the answer and source metadata.

## How PDF knowledge ingestion works
1. User uploads a PDF or TXT file from Knowledge documents.
2. Flask validates the extension and size.
3. pypdf extracts selectable text from PDF pages (TXT files are read as text).
4. Extracted text is split into overlapping chunks.
5. The chunks are added to the in-memory TF-IDF index.
6. Future questions can retrieve matching passages from the uploaded source.
Uploaded files are stored in `uploads/` and indexed again when the app starts.

## Important technical honesty
This is a retrieval-augmented **retrieval prototype**, not a full generative RAG system. It retrieves and displays source passages; it does not use an LLM to synthesize new answers. Scanned PDFs without selectable text need OCR, which is not included. It does not currently provide login, role-based access, persistent chat history, or production deployment.

## Before real university use
Replace sample content with verified university information and official documents. Add authentication, file scanning, access controls, a persistent vector database, OCR if needed, an LLM with grounded prompting, tests, secure configuration and production hosting before deployment. Do not use Flask debug mode in production.
