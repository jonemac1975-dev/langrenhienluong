//======================================================
// HIENLUONG WEBSITE
// Folder : /js
// File   : documents.js
//======================================================

import { readData } from "../scripts/firebaseService.js";

export async function loadDocuments(){

    const data = await readData("home/documents");

    if(!data) return;

    const container=document.getElementById("documents-container");

    if(!container) return;

    container.innerHTML="";

    Object.values(data)
    .sort((a,b)=>(b.updated_at||0)-(a.updated_at||0))
    .forEach(item=>{

        container.innerHTML+=`

        <div class="module-card">

            ${
                item.image
                ?`
                <div class="module-image">

                    <img src="${item.image}" alt="${item.title||""}">

                </div>
                `
                :""
            }

            <div class="module-body">

                <div class="module-date">

                    📚 ${item.type||""}

                    &nbsp;&nbsp;|&nbsp;&nbsp;

                    📅 ${item.date||""}

                    &nbsp;&nbsp;|&nbsp;&nbsp;

                    ✍ ${item.author||""}

                </div>

                <h2 class="module-title">

                    ${item.title||"Không có tiêu đề"}

                </h2>

                ${
                    item.link
                    ?`
                    <a class="module-button"
                       href="${item.link}"
                       target="_blank">

                        📖 Mở tài liệu

                    </a>
                    `
                    :""
                }

                ${
                    item.source
                    ?`
                    <div style="margin-top:20px;color:#666;">

                        📚 Nguồn : ${item.source}

                    </div>
                    `
                    :""
                }

            </div>

        </div>

        `;

    });

}