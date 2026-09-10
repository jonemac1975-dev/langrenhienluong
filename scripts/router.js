//======================================================
// HIENLUONG WEBSITE
// Folder : /scripts
// File   : router.js
//======================================================

console.log("🔥 ROUTER LOADED");

//======================================================

export async function loadPage(

    containerId,

    htmlFile,

    jsFile = null

){

    const container =

        document.getElementById(

            containerId

        );

    if(!container){

        console.error(

            "Container not found :",

            containerId

        );

        return;

    }

    try{

        //----------------------------------
        // LOAD HTML
        //----------------------------------

        const response =

            await fetch(

                htmlFile

            );

        if(!response.ok){

            throw new Error(

                htmlFile

            );

        }

        container.innerHTML =

            await response.text();

        //----------------------------------
        // LOAD JS
        //----------------------------------

        if(jsFile){

            const module =

                await import(

                    `${jsFile}?t=${Date.now()}`

                );

            if(module.init){

                await module.init();

            }

        }

    }

    catch(error){

        console.error(error);

        container.innerHTML =

        `
        <div style="
            padding:40px;
            color:red;
            font-weight:bold;">
            Không load được:
            ${htmlFile}
        </div>
        `;

    }

}

//======================================================

export function clearPage(

    containerId

){

    const container =

        document.getElementById(

            containerId

        );

    if(container){

        container.innerHTML = "";

    }

}