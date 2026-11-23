
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. FLASK API CONFIGURATION
    // ==========================================

    const API = {
        chat: "/api/chat",
        upload: "/api/upload",
        documents: "/api/documents",
        deleteDocument: (filename) =>
            `/api/documents/${encodeURIComponent(filename)}`
    };

    const HISTORY_KEY = "campusassist_chat_history";
    const CURRENT_KEY = "campusassist_current_chat";

    // ==========================================
    // 2. HTML ELEMENTS
    // ==========================================

    const messages = document.getElementById("messages");
    const welcomeScreen = document.getElementById("welcomeScreen");
    const chatContainer = document.getElementById("chatContainer");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const typingIndicator = document.getElementById("typingIndicator");
    const historyList = document.getElementById("historyList");
    const fileInput = document.getElementById("fileInput");
    const settingsModal = document.getElementById("settingsModal");
    const documentList = document.getElementById("documentList");
    const sidebar = document.getElementById("sidebar");

    let conversations = loadHistory();
    let currentChatId = localStorage.getItem(CURRENT_KEY) || null;
    let currentMessages = [];
    let isSending = false;

    // ==========================================
    // 3. CHAT HISTORY MANAGEMENT
    // ==========================================

    function loadHistory() {
        try {
            const data = JSON.parse(
                localStorage.getItem(HISTORY_KEY)
            );

            return Array.isArray(data) ? data : [];

        } catch (error) {
            console.error("History loading error:", error);
            return [];
        }
    }

    function saveHistory() {
        try {
            localStorage.setItem(
                HISTORY_KEY,
                JSON.stringify(conversations)
            );

            localStorage.setItem(
                CURRENT_KEY,
                currentChatId || ""
            );

        } catch (error) {
            console.error("History saving error:", error);
        }
    }

    function createChat() {

        currentChatId = "chat_" + Date.now();
        currentMessages = [];

        conversations.unshift({
            id: currentChatId,
            title: "New Conversation",
            messages: [],
            updated: Date.now()
        });

        messages.innerHTML = "";

        welcomeScreen.style.display = "block";

        userInput.value = "";
        userInput.style.height = "auto";

        saveHistory();
        renderHistory();

        sidebar.classList.remove("open");

        userInput.focus();
    }

    function saveCurrentChat() {

        if (!currentChatId) return;

        let chat = conversations.find(
            item => item.id === currentChatId
        );

        if (!chat) {

            chat = {
                id: currentChatId,
                title: "New Conversation",
                messages: [],
                updated: Date.now()
            };

            conversations.unshift(chat);
        }

        chat.messages = currentMessages;
        chat.updated = Date.now();

        const firstMessage = currentMessages.find(
            item => item.role === "user"
        );

        if (firstMessage) {

            chat.title = firstMessage.content
                .replace(/\s+/g, " ")
                .substring(0, 35);

        } else {

            chat.title = "New Conversation";
        }

        conversations.sort(
            (a, b) => b.updated - a.updated
        );

        saveHistory();
        renderHistory();
    }

    // ==========================================
    // 4. RENDER CHAT HISTORY
    // ==========================================

    function renderHistory() {

        historyList.innerHTML = "";

        if (!conversations.length) {

            historyList.innerHTML =
                '<div class="empty-history">No conversations yet</div>';

            return;
        }

        conversations.forEach(chat => {

            const item = document.createElement("div");

            item.className =
                "history-item" +
                (chat.id === currentChatId ? " active" : "");

            const icon = document.createElement("i");

            icon.className = "fa-regular fa-message";

            const title = document.createElement("span");

            title.textContent =
                chat.title || "New Conversation";

            item.append(icon, title);

            item.addEventListener("click", () => {
                openChat(chat.id);
            });

            historyList.appendChild(item);

        });
    }

    // ==========================================
    // 5. OPEN PREVIOUS CONVERSATION
    // ==========================================

    function openChat(id) {

        const chat = conversations.find(
            item => item.id === id
        );

        if (!chat) return;

        currentChatId = id;

        currentMessages = Array.isArray(chat.messages)
            ? [...chat.messages]
            : [];

        messages.innerHTML = "";

        welcomeScreen.style.display =
            currentMessages.length ? "none" : "block";

        currentMessages.forEach(message => {

            addMessage(
                message.role,
                message.content,
                false
            );

        });

        saveHistory();
        renderHistory();

        scrollToBottom();

        sidebar.classList.remove("open");
    }

    // ==========================================
    // 6. SAFE MESSAGE FORMATTING
    // ==========================================

    function escapeHTML(text) {

        return String(text).replace(
            /[&<>"']/g,
            char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[char]
        );
    }

    function formatMessage(text) {

        let safe = escapeHTML(text);

        safe = safe.replace(
            /```([\s\S]*?)```/g,
            (_, code) => `<pre><code>${code.trim()}</code></pre>`
        );

        safe = safe.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );

        safe = safe.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );

        safe = safe.replace(
            /\*(.*?)\*/g,
            "<em>$1</em>"
        );

        return safe
            .split(/\n{2,}/)
            .map(part => `<p>${part.replace(/\n/g, "<br>")}</p>`)
            .join("");
    }

    // ==========================================
    // 7. ADD MESSAGE TO CHAT
    // ==========================================

    function addMessage(role, content, save = true) {

        welcomeScreen.style.display = "none";

        const wrapper = document.createElement("div");

        wrapper.className = `message ${role}`;

        const avatar = document.createElement("div");

        avatar.className = "message-avatar";

        avatar.innerHTML = role === "user"
            ? '<i class="fa-solid fa-user"></i>'
            : '<i class="fa-solid fa-atom"></i>';

        const messageContent = document.createElement("div");

        messageContent.className = "message-content";

        const name = document.createElement("div");

        name.className = "message-name";

        name.textContent = role === "user"
            ? "YOU"
            : "CAMPUSASSIST";

        const bubble = document.createElement("div");

        bubble.className = "message-bubble";

        bubble.innerHTML = formatMessage(content);

        const time = document.createElement("div");

        time.className = "message-time";

        time.textContent = new Date().toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

        messageContent.append(
            name,
            bubble,
            time
        );

        wrapper.append(
            avatar,
            messageContent
        );

        messages.appendChild(wrapper);

        if (save) {

            currentMessages.push({
                role: role,
                content: content,
                timestamp: Date.now()
            });

            saveCurrentChat();
        }

        scrollToBottom();
    }

    // ==========================================
    // 8. AUTO SCROLL
    // ==========================================

    function scrollToBottom() {

        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: "smooth"
        });
    }

    // ==========================================
    // 9. SEND MESSAGE TO FLASK + GEMINI
    // ==========================================

    async function sendMessage() {

        const message = userInput.value.trim();

        if (!message || isSending) return;

        if (!currentChatId) {
            createChat();
        }

        isSending = true;

        sendBtn.disabled = true;

        // Display user message

        addMessage("user", message);

        userInput.value = "";

        userInput.style.height = "auto";

        // Show processing animation

        typingIndicator.classList.add("active");

        scrollToBottom();

        try {

            // Correct Flask endpoint: /api/chat

            const response = await fetch(API.chat, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message
                })

            });

            // Handle HTTP errors

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    `Server error: ${response.status}`
                );
            }

            // Flask returns answer, not reply

            const reply = data.answer;

            if (!reply || !String(reply).trim()) {

                throw new Error(
                    data.ai_notice ||
                    "The AI returned an empty response."
                );
            }

            // Display Gemini response

            addMessage("assistant", reply);

            if (data.ai_status === "error") {
                console.warn("Gemini warning:", data.ai_notice);
            }

            if (data.ai_status === "disabled") {
                console.warn("Gemini disabled:", data.ai_notice);
            }

        } catch (error) {

            console.error("CampusAssist Chat Error:", error);

            addMessage(
                "assistant",
                `**Connection Error**

${error.message}

Please check your Flask server and Gemini API configuration.`
            );

        } finally {

            typingIndicator.classList.remove("active");

            isSending = false;

            sendBtn.disabled = false;

            userInput.focus();

        }
    }

    sendBtn.addEventListener("click", sendMessage);

    // Enter to send, Shift + Enter for new line

    userInput.addEventListener("keydown", event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }

    });

    // Auto-resize textarea

    userInput.addEventListener("input", () => {

        userInput.style.height = "auto";

        userInput.style.height =
            Math.min(userInput.scrollHeight, 130) + "px";

    });

    // ==========================================
    // 10. SUGGESTED QUESTIONS
    // ==========================================

    document.querySelectorAll(".suggestion-card").forEach(card => {

        card.addEventListener("click", () => {

            userInput.value = card.dataset.prompt || "";

            sendMessage();

        });

    });

    // ==========================================
    // 11. NEW CHAT
    // ==========================================

    document.getElementById("newChatBtn")
        .addEventListener("click", () => {

            createChat();

        });

    // ==========================================
    // 12. CLEAR CURRENT CHAT
    // ==========================================

    document.getElementById("clearChatBtn")
        .addEventListener("click", () => {

            if (!currentChatId) return;

            if (!confirm(
                "Are you sure you want to clear this conversation?"
            )) {
                return;
            }

            currentMessages = [];

            messages.innerHTML = "";

            welcomeScreen.style.display = "block";

            const chat = conversations.find(
                item => item.id === currentChatId
            );

            if (chat) {

                chat.messages = [];

                chat.title = "New Conversation";

                chat.updated = Date.now();
            }

            saveHistory();

            renderHistory();

        });

    // ==========================================
    // 13. CHAT HISTORY BUTTON
    // ==========================================

    document.getElementById("historyBtn")
        .addEventListener("click", () => {

            if (conversations.length) {

                openChat(conversations[0].id);

            } else {

                createChat();
            }

        });

    // ==========================================
    // 14. SETTINGS MODAL
    // ==========================================

    function openSettings() {

        settingsModal.classList.add("show");

        loadDocuments();
    }

    function closeSettings() {

        settingsModal.classList.remove("show");
    }

    document.getElementById("settingsBtn")
        .addEventListener("click", openSettings);

    document.getElementById("settingsIconBtn")
        .addEventListener("click", openSettings);

    document.getElementById("closeSettings")
        .addEventListener("click", closeSettings);

    settingsModal.addEventListener("click", event => {

        if (event.target === settingsModal) {

            closeSettings();
        }

    });

    // ==========================================
    // 15. DOCUMENT UPLOAD BUTTONS
    // ==========================================

    document.getElementById("uploadBtn")
        .addEventListener("click", () => {

            fileInput.click();

        });

    document.getElementById("settingsUploadBtn")
        .addEventListener("click", () => {

            fileInput.click();

        });

    // ==========================================
    // 16. UPLOAD PDF / TXT DOCUMENT
    // ==========================================

    fileInput.addEventListener("change", async () => {

        const file = fileInput.files[0];

        if (!file) return;

        const extension = file.name
            .substring(file.name.lastIndexOf("."))
            .toLowerCase();

        if (![".pdf", ".txt"].includes(extension)) {

            alert("Only PDF and TXT files are supported.");

            fileInput.value = "";

            return;
        }

        const formData = new FormData();

        // IMPORTANT: Flask expects "document"

        formData.append("document", file);

        try {

            const response = await fetch(API.upload, {

                method: "POST",

                body: formData

            });

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error || "Document upload failed."
                );
            }

            alert(
                data.message ||
                "Document uploaded successfully."
            );

            await loadDocuments();

        } catch (error) {

            console.error("Upload Error:", error);

            alert(
                "Document upload failed: " + error.message
            );

        } finally {

            fileInput.value = "";

        }

    });

    // ==========================================
    // 17. LOAD UPLOADED DOCUMENTS
    // ==========================================

    async function loadDocuments() {

        documentList.innerHTML =
            '<p class="empty-history">Loading documents...</p>';

        try {

            const response = await fetch(API.documents);

            if (!response.ok) {

                throw new Error(
                    "Unable to retrieve documents."
                );
            }

            const documents = await response.json();

            documentList.innerHTML = "";

            if (!Array.isArray(documents) || documents.length === 0) {

                documentList.innerHTML =
                    '<p class="empty-history">No documents uploaded yet.</p>';

                return;
            }

            documents.forEach(doc => {

                // Flask returns name and type

                const filename = doc.name;

                if (!filename) return;

                const item = document.createElement("div");

                item.className = "document-item";

                const label = document.createElement("span");

                label.textContent = filename;

                const deleteBtn = document.createElement("button");

                deleteBtn.className = "delete-document";

                deleteBtn.innerHTML =
                    '<i class="fa-solid fa-trash"></i>';

                deleteBtn.title = "Delete document";

                deleteBtn.addEventListener("click", () => {

                    deleteDocument(filename);

                });

                item.append(label, deleteBtn);

                documentList.appendChild(item);

            });

        } catch (error) {

            console.error("Document Loading Error:", error);

            documentList.innerHTML = `
                <p class="empty-history">
                    ${escapeHTML(error.message)}
                </p>
            `;

        }

    }

    // ==========================================
    // 18. DELETE DOCUMENT
    // ==========================================

    async function deleteDocument(filename) {

        if (!confirm(
            `Are you sure you want to delete ${filename}?`
        )) {
            return;
        }

        try {

            const response = await fetch(
                API.deleteDocument(filename),
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error || "Document deletion failed."
                );
            }

            alert(
                data.message ||
                "Document deleted successfully."
            );

            await loadDocuments();

        } catch (error) {

            console.error("Delete Error:", error);

            alert(
                "Could not delete document: " + error.message
            );

        }

    }

    // ==========================================
    // 19. VOICE RECOGNITION
    // ==========================================

    const voiceButtons = [
        document.getElementById("voiceBtn"),
        document.getElementById("voiceInputBtn")
    ];

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (SpeechRecognition) {

        const recognition = new SpeechRecognition();

        recognition.lang = "en-IN";

        recognition.continuous = false;

        recognition.interimResults = false;

        voiceButtons.forEach(button => {

            button.addEventListener("click", () => {

                try {

                    recognition.start();

                    button.style.color = "#00ffc3";

                } catch (error) {

                    console.log(
                        "Voice recognition is already active."
                    );

                }

            });

        });

        recognition.onresult = event => {

            const transcript =
                event.results[0][0].transcript;

            userInput.value = transcript;

            userInput.focus();

        };

        recognition.onend = () => {

            voiceButtons.forEach(button => {

                button.style.color = "";

            });

        };

        recognition.onerror = event => {

            console.error(
                "Voice Recognition Error:",
                event.error
            );

        };

    } else {

        voiceButtons.forEach(button => {

            button.addEventListener("click", () => {

                alert(
                    "Voice recognition is not supported in this browser."
                );

            });

        });

    }

    // ==========================================
    // 20. MOBILE SIDEBAR
    // ==========================================

    document.getElementById("mobileMenu")
        .addEventListener("click", () => {

            sidebar.classList.toggle("open");

        });

    // ==========================================
    // 21. CHECK FLASK BACKEND STATUS
    // ==========================================

    async function checkBackend() {

        try {

            const response = await fetch("/api/health");

            if (!response.ok) {

                throw new Error("Backend unavailable");
            }

            const data = await response.json();

            console.log(
                "CampusAssist Backend:",
                data
            );

            if (!data.ai_enabled) {

                console.warn(
                    "Gemini API is not configured. Check your .env file."
                );

            } else {

                console.log(
                    "Gemini AI connected:",
                    data.ai_model
                );

            }

        } catch (error) {

            console.error(
                "Backend Health Check Failed:",
                error
            );

        }

    }

    // ==========================================
    // 22. INITIALIZE CAMPUSASSIST
    // ==========================================

    renderHistory();

    const savedChat = conversations.find(
        chat => chat.id === currentChatId
    );

    if (savedChat) {

        openChat(savedChat.id);

    } else {

        createChat();

    }

    checkBackend();

    console.log(
        "%c CAMPUSASSIST INITIALIZED ",
        "background:#00e5ff;color:#001018;font-weight:bold;padding:8px;"
    );

    console.log(
        "JARVIS Interface: ONLINE"
    );

});
