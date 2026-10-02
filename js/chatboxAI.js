//======================================================
// HIENLUONG
// CHATBOX AI
//======================================================

const aiButton=document.getElementById("hl-ai-button");
const aiWindow=document.getElementById("hl-ai-window");
const aiClose=document.getElementById("hl-ai-close");
const aiInput=document.getElementById("hl-ai-input");
const aiSend=document.getElementById("hl-ai-send");
const aiMessages=document.getElementById("hl-ai-messages");

if(aiButton){
    aiButton.addEventListener("click",function(){
        aiWindow.classList.toggle("active");
        if(aiWindow.classList.contains("active")){
            aiInput?.focus();
        }
    });
}

if(aiClose){
    aiClose.addEventListener("click",function(){
        aiWindow.classList.remove("active");
    });
}

function addMessage(text,type="bot"){
    const message=document.createElement("div");
    message.className=`hl-ai-message hl-ai-message-${type}`;

    if(type==="bot"){
        message.innerHTML=`
            <div class="hl-ai-message-avatar">🤖</div>
            <div class="hl-ai-message-content">${text}</div>
        `;
    }else{
        message.innerHTML=`
            <div class="hl-ai-message-content">${text}</div>
        `;
    }

    aiMessages.appendChild(message);
    aiMessages.scrollTop=aiMessages.scrollHeight;
}

function sendMessage(){
    const text=aiInput.value.trim();
    if(!text)return;

    addMessage(text,"user");
    aiInput.value="";

    addMessage("Đang suy nghĩ... 🤖","bot");

    fetch("https://hienluong-ai.jonemac1975.workers.dev/",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:text})
    })
    .then(response=>response.json())
    .then(data=>{
        const thinkingMessages=aiMessages.querySelectorAll(".hl-ai-message-bot");
        const lastMessage=thinkingMessages[thinkingMessages.length-1];

        if(lastMessage&&lastMessage.textContent.includes("Đang suy nghĩ")){
            lastMessage.remove();
        }

        addMessage(data.answer||"Xin lỗi, tôi chưa nhận được câu trả lời.");
    })
    .catch(error=>{
        console.error("❌ AI ERROR:",error);

        const thinkingMessages=aiMessages.querySelectorAll(".hl-ai-message-bot");
        const lastMessage=thinkingMessages[thinkingMessages.length-1];

        if(lastMessage&&lastMessage.textContent.includes("Đang suy nghĩ")){
            lastMessage.remove();
        }

        addMessage("Xin lỗi anh, hiện tại trợ lý AI đang gặp sự cố. 🤖");
    });
}

if(aiSend){
    aiSend.addEventListener("click",sendMessage);
}

if(aiInput){
    aiInput.addEventListener("keydown",function(event){
        if(event.key==="Enter"){
            event.preventDefault();
            sendMessage();
        }
    });
}