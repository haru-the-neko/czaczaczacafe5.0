document.addEventListener("DOMContentLoaded", function(){
  // demo patient data
  const patients = [
  { id: "p1", name: "Latrel Angelo", avatarText: "LA", img: "images/Latrel.jfif" },
  { id: "p2", name: "Steph Landicho", avatarText: "SL", img: "images/Steph.jfif" },
  { id: "p3", name: "Jay Albufera", avatarText: "JA",}
];


  const listEl = document.getElementById("patients-list");
  const chatArea = document.getElementById("chat-area");
  const chatName = document.getElementById("chat-name");
  const chatSub = document.getElementById("chat-sub");
  const chatAvatar = document.getElementById("chat-avatar");
  const chatText = document.getElementById("chat-text");
  const sendBtn = document.getElementById("send-btn");
  const search = document.getElementById("comm-search");
  const resolveBtn = document.getElementById("resolve-btn");

  // load or init messages store
  const storeKey = "konsutal_comm_messages_v1";
  const messagesStore = JSON.parse(localStorage.getItem(storeKey) || "{}");

  let activeId = null;

  function saveStore(){ 
    localStorage.setItem(storeKey, JSON.stringify(messagesStore)); 
  }

  function renderPatientList(filter=""){
    listEl.innerHTML = "";
    patients
      .filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
      .forEach(p => {
        const unread = (messagesStore[p.id] || [])
          .filter(m => m.to === "bhw" && !m.read).length;

        const el = document.createElement("div");
        el.className = "patient-item";
        if (p.id === activeId) el.classList.add("active");

        el.innerHTML = `
          <div class="patient-avatar">
              ${p.img ? `<img src="${p.img}" alt="${p.name}" />` : p.avatarText}
            </div>

          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="font-weight:700">${p.name}</div>
              ${unread ? `<div class="unread-badge">${unread}</div>` : ""}
            </div>
            <div class="patient-meta">
              ${(messagesStore[p.id] && messagesStore[p.id].slice(-1)[0]?.text) || "No messages yet"}
            </div>
          </div>
        `;
        el.addEventListener("click", () => { setActive(p.id); });
        listEl.appendChild(el);
      });
  }

  function setActive(id){
    activeId = id;
    const p = patients.find(x=>x.id===id);
    if (!p) return;

    document.querySelectorAll(".patient-item").forEach(n=>n.classList.remove("active"));

    chatName.textContent = p.name;
    if (p.img) {
    chatAvatar.innerHTML = `<img src="${p.img}" alt="${p.name}" />`;
} else {
    chatAvatar.textContent = p.avatarText;
}


    const lastMsg = messagesStore[id]?.slice(-1)[0];
    chatSub.textContent = lastMsg ? new Date(lastMsg.ts).toLocaleString() : "No messages yet";

    renderChat(id);
    renderPatientList(search.value || "");

    // mark messages as read
    if (messagesStore[id]) {
      messagesStore[id].forEach(m => { 
        if (m.to === "bhw") m.read = true; 
      });
      saveStore();
      renderPatientList(search.value || "");
    }
  }

  function deleteMessage(patientId, index){
    if (!messagesStore[patientId]) return;
    messagesStore[patientId].splice(index, 1);
    saveStore();
    renderChat(patientId);
    renderPatientList(search.value || "");
  }

  function renderChat(id){
    chatArea.innerHTML = "";
    const msgs = messagesStore[id] || [];

    if (msgs.length === 0) {
      chatArea.innerHTML = `<div class="small-muted">No conversation — send the first message.</div>`;
      return;
    }

    msgs.forEach((m, i) => {
      const d = document.createElement("div");
      d.className = "msg " + (m.from === "bhw" ? "bhw" : "patient");

      d.innerHTML = `
        <div>${escapeHtml(m.text)}</div>
        <div class="msg-meta">
          ${new Date(m.ts).toLocaleString()}
          <button class="delete-msg-btn" data-index="${i}" style="
            margin-left:10px;
            background:#ff4d4d;
            color:white;
            border:none;
            padding:2px 6px;
            font-size:10px;
            border-radius:4px;
            cursor:pointer;
          ">Delete</button>
        </div>
      `;

      chatArea.appendChild(d);
    });

    // attach delete event listeners
    document.querySelectorAll(".delete-msg-btn").forEach(btn => {
      btn.addEventListener("click", (e)=>{
        const idx = e.target.dataset.index;
        deleteMessage(id, idx);
      });
    });

    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function sendMessage(text){
    if (!activeId) { alert("Select a patient first."); return; }
    if (!text.trim()) return;

    const m = { from:"bhw", to:"patient", text:text.trim(), ts: Date.now() };

    messagesStore[activeId] = messagesStore[activeId] || [];
    messagesStore[activeId].push(m);
    saveStore();

    renderChat(activeId);
    renderPatientList(search.value || "");
    chatText.value = "";

    // simulated patient reply
    setTimeout(() => {
      const reply = { 
        from:"patient", 
        to:"bhw", 
        text:"Thanks. Received.", 
        ts: Date.now()+2000, 
        read:false 
      };
      messagesStore[activeId].push(reply);
      saveStore();

      if (activeId) renderChat(activeId);
      renderPatientList(search.value || "");
    }, 1200);
  }

  sendBtn.addEventListener("click", () => sendMessage(chatText.value));
  chatText.addEventListener("keydown", (e) => { 
    if (e.key === "Enter") { 
      e.preventDefault(); 
      sendMessage(chatText.value); 
    }
  });

  search.addEventListener("input", (e) => { 
    renderPatientList(e.target.value); 
  });

  resolveBtn.addEventListener("click", () => {
    if (!activeId) return alert("Select a patient");

    messagesStore[activeId] = messagesStore[activeId] || [];
    messagesStore[activeId].push({ 
      from:"system", 
      to:"bhw", 
      text:"Conversation marked resolved", 
      ts: Date.now() 
    });
    saveStore();

    renderChat(activeId);
    renderPatientList(search.value || "");
    alert("Marked resolved (demo).");
  });

  function escapeHtml(s){ 
    return s.replace(/[&<>"']/g, c => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[c])); 
  }

  // initialize
  renderPatientList();
});
