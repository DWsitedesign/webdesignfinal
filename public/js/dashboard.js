panels = {
    settings: document.getElementById("settings"),
    contacts: document.getElementById("contacts"),
    // eventsDash: document.getElementById("eventsDash"),
    users: document.getElementById("users")
}

document.querySelector(".buttonSidebar").addEventListener("click", ev =>{
    if(ev.target.tagName.toLowerCase()==="button"){
        val=ev.target.dataset.target
        for(el in panels){
            if (el==val){
                panels[el].classList.add("show")
            }else{
                panels[el].classList.remove("show")
            }
        }
}
})

let buttons = document.querySelectorAll(".rightBtn>button")


buttons.forEach(el => {
    el.addEventListener("click", e =>{
        if (e.target.classList.contains("updateValues")){
            let values = {}
            e.target.parentElement.parentElement.querySelectorAll("select, input").forEach(i=>{
                if (i.type == "checkbox"){
                    values[i.name]=i.checked;
                }else{
                values[i.name]=i.value;
                }
            })
            sendValues("/update",{
                id: e.target.dataset.id,
                target: e.target.dataset.target,
                values: values
            })
        }else{
        sendValues("/values",{
            id: e.target.dataset.id,
            target: e.target.dataset.target
        })
        }
    })
})

function sendValues(url, data){
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    let body = data;
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            data = JSON.parse(xhr.responseText);
            if (data.success){
                location.reload()
            }
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(JSON.stringify(body));
}
