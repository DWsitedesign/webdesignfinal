let loginBtns = document.getElementsByClassName("modalLogin");
let modalLogin = document.getElementsByClassName("modals")[0];

modalLogin.addEventListener("click",(e)=>{
    if(e.target.classList.contains("modals") || e.target.classList.contains("closeModal")){
       modalLogin.classList.remove("open")
        document.querySelector("body").classList.remove("no-scroll")
    }
    if(e.target.classList.contains("joinModal")){
        document.querySelector("#loginM").classList.toggle("modalOpen")
        document.querySelector("#joinM").classList.toggle("modalOpen")

    }
    if(e.target.tagName.toLowerCase()==="button" && e.target.classList.contains("clickcursor")){
        sendForm();
    }
})
for (let i = 0; i < loginBtns.length; i++) {
    loginBtns[i].addEventListener("click", function (e) {
        openDropDown();
        modalLogin.classList.add("open")
        document.querySelector("body").classList.add("no-scroll")
    });
}

const toggleBtn = document.querySelector(".toggle_btn")
const toggleBtnIcon = document.querySelector(".toggle_btn i")
const dropDownMenu = document.querySelector(".dropdown_menu")

toggleBtn.onclick = openDropDown;

function openDropDown() {
    dropDownMenu.classList.toggle("open");
    const isOpen = dropDownMenu.classList.contains("open")

    toggleBtnIcon.classList = isOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars";
}



function sendForm(){
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/login");
    xhr.setRequestHeader("Content-Type", "application/json");
    let openModal=document.querySelector("form>.modalOpen")
    let values = openModal.querySelectorAll("input")
    let body ={};
    body['goal']="register"
    if (openModal.id=="loginM"){
        body['goal']="login"
    }

    for (i=0;i<values.length;i++){
        body[values[i].name]=values[i].value
    }
    console.log(JSON.stringify(body))
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            data = JSON.parse(xhr.responseText);
            if (data.success){
                location.reload()
            }else{
                console.log(data)
                errorHolder = document.getElementById("loginError");
                errorHolder.innerText=data.message;
                errorHolder.classList.remove("hide")
            }
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(JSON.stringify(body));
}

let logoutBtn = document.getElementById("logout");
if(logoutBtn)
    logoutBtn.addEventListener("click", ev => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/logout");
    xhr.setRequestHeader("Content-Type", "application/json");

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
    xhr.send(JSON.stringify({logout: true}));
} )