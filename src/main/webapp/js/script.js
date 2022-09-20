const select = document.getElementById("PlayersOnPage");
const saveBtn = document.getElementById("saveBtn");
let countOnPage = select.value;
let dataOnPage;
const races = ["HUMAN","DWARF","ELF","GIANT","ORC","TROLL","HOBBIT"];
const professions = ["WARRIOR","ROGUE","SORCERER","CLERIC","PALADIN","NAZGUL","WARLOCK","DRUID"];

Date.prototype.toDateInputValue = (function() {
    let local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});

function createSelector(options, selectedValue) {
    const sel = document.createElement('select');

    sel.innerHTML = options.map(option =>{
        const selected = option===selectedValue?" selected":"";
        return `<option value="${option}" ${selected}>${option}</option>`;
    });

    return sel;
}

function createInput(currentValue){
    const input = document.createElement('input');
    input.type = "text";
    input.value = currentValue;
    return input;
}

function createTD(name, value){
    let tdElement = document.createElement("td");
    tdElement.setAttribute("data-name", name);
    if (name === "birthday"){
        let date = new Date(value);
        let newValue = date.getMonth()+1 + '/' + date.getDate() + '/' + date.getFullYear();
        tdElement.textContent = newValue;
    } else {
        tdElement.textContent = value;
    }
    return tdElement;
}
const createTableFunction = function( data ) {
    dataOnPage = data;
    $.each(data, function (index, value) {
        let TableRow = document.createElement("tr");
        TableRow.setAttribute("data-id", value.id);
        let tdID = createTD("id", value.id);
        let tdName = createTD("name", value.name);
        let tdTitle = createTD("title", value.title);
        let tdRace = createTD("race", value.race);
        let tdProfession = createTD("profession", value.profession);
        let tdLevel = createTD("level", value.level);
        let tdBirthday = createTD("birthday", value.birthday);
        let tdBanned = createTD("banned", value.banned);

        TableRow.append(tdID, tdName, tdTitle, tdRace, tdProfession, tdLevel, tdBirthday, tdBanned);
        $("#players").append(TableRow);
    });
    let rows = document.querySelectorAll("tr");
    if (rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
            let tdEdit = document.createElement("td");
            tdEdit.append(addButtonWithImage("/img/edit.png", "edit"));
            tdEdit.append(addButtonWithImage("/img/save.png", "save"));
            let tdDelete = document.createElement("td");
            tdDelete.append(addButtonWithImage("/img/delete.png", "delete"));
            rows[i].append(tdEdit);
            rows[i].append(tdDelete);
        }
    }
}

function upTo(el, tagName) {
    tagName = tagName.toLowerCase();

    while (el && el.parentNode) {
        el = el.parentNode;
        if (el.tagName && el.tagName.toLowerCase() === tagName) {
            return el;
        }
    }
    return null;
}

function deleteHandler(id){

    $.ajax({
        url: `/rest/players/${id}`,
        type: 'DELETE',
        success: function(result) {
            let currentPage = document.querySelectorAll('.selectedBtn').item(0).id;
            createPlayersTable(currentPage);
            createPageButtons(currentPage);
        }
    });
}

function replaceElement(cell, tag, value, options){
    switch(tag){
        case "input": {
            cell.innerHTML="";
            const input = createInput(value);
            cell.appendChild(input);
        }
        break;
        case "selector": {
            cell.innerHTML="";
            const selector = createSelector(options, value);
            cell.appendChild(selector);
        };
        break;
    }
}

function editHandler(id, row){
    const [data] = dataOnPage.filter((item)=>Number(item.id)===Number(id));
    row.querySelectorAll("td").forEach((item)=> {
        const name = item.getAttribute("data-name");
        switch (name){
            case "name": replaceElement(item, "input", data[name]);
            break;
            case "title": replaceElement(item, "input", data[name]);
            break;
            case "race": replaceElement(item, "selector", data[name], races);
            break;
            case "profession": replaceElement(item, "selector", data[name], professions);
            break;
            case "banned": replaceElement(item, "selector", data[name], [true, false]);
            break;
        }
    });
}

function saveHandler(id, row){
    let updatedParameters = new Object();
    const [data] = dataOnPage.filter((item)=>Number(item.id)===Number(id));
    row.querySelectorAll("td").forEach((item)=> {
        name = item.getAttribute("data-name");
        switch (name) {
            case "name":
                updatedParameters.name = item.childNodes[0].value;
                break;
            case "title":
                updatedParameters.title = item.childNodes[0].value;
                break;
            case "race":
                updatedParameters.race = item.childNodes[0].value;
                break;
            case "profession":
                updatedParameters.profession = item.childNodes[0].value;
                break;
            case "banned":
                updatedParameters.banned = item.childNodes[0].value;
                break;
        }
    })

    if (updatedParameters.name === "" || updatedParameters.title === ""){
        alert("Field \"Name\" and \"Title\" required and can't be empty!")
        row.className="is-edit";
    } else {
        $.ajax( {
            type: "POST",
            url: `/rest/players/${id}`,
            data: JSON.stringify(updatedParameters),
            contentType: "application/json;charset=utf-8",
            success: function( response ) {
                let currentPage = document.querySelectorAll('.selectedBtn').item(0).id;
                createPlayersTable(currentPage);
                console.log( response );
            }
        });
    }
}

function addButtonWithImage(imgPath, type){
    let btn = document.createElement("button");
    btn.classList.add(`is-${type}`);
    let img = document.createElement("img");
    img.src = imgPath;
    btn.appendChild(img);
    btn.addEventListener("click",(event)=>{
        event.preventDefault();
        event.stopPropagation();
        const { target } = event;
        let trElement = upTo(target, "tr");
        let id = trElement.getAttribute("data-id");
        trElement.className=`is-${type}`;
        switch (type) {
            case "delete": deleteHandler(id);
            break;
            case "edit": editHandler(id, trElement);
            break;
            case "save": saveHandler(id, trElement);
            break;
        }
        //console.warn(type, target, id);
    })
    return btn;
}

function createPlayersTable(number){
    let tableRows = document.querySelectorAll("tr");
    if (tableRows.length > 1) {
        for (let i = 1; i < tableRows.length; i++) {
            tableRows[i].remove();
        }
    }
    $.get("rest/players",{ pageNumber: number, pageSize: countOnPage}, createTableFunction);
}
function createPageButtons(currentPageNumber) {
    $.get("rest/players/count", (data) => {
        let buttonsCount = Math.ceil(data / countOnPage);

        let divButtons = document.getElementById("padding");
        let currentButtons = divButtons.querySelectorAll("button");
        if (currentButtons.length > 0){
            currentButtons.forEach((b)=>b.remove());
        }
        for (let i = 0; i < buttonsCount; i++) {
            let btn = document.createElement("button");
            btn.textContent = i + 1;
            btn.id = i;
            if ((i == currentPageNumber && currentPageNumber >= 0) || (i === buttonsCount-1 && currentPageNumber < 0)){
                btn.className = "selectedBtn";
            } else if (i ===0  && currentPageNumber > buttonsCount-1){
                btn.className = "selectedBtn";
            } else {
                btn.className = "btnClass";
            }
            divButtons.appendChild(btn);

            btn.addEventListener('click', (e)=>{
                createPlayersTable(e.target.id);
                let currentButtons = divButtons.querySelectorAll("button");
                if (currentButtons.length > 0){
                    currentButtons.forEach((b)=>b.className = "btnClass");
                }
                e.target.className = "selectedBtn";
            });
        }
        if (currentPageNumber < 0){
            createPlayersTable(buttonsCount-1);
        }
    });

}

createPlayersTable(0);
createPageButtons(0);

select.addEventListener('change', ()=>{
    countOnPage = select.value;
    createPlayersTable(0);
    createPageButtons(0);
})
saveBtn.addEventListener('click',(event)=>{
    const newPlayer = new Object();
    newPlayer.name = $("#name").val();
    newPlayer.title = $("#title").val();
    newPlayer.race = $("#races").val();
    newPlayer.profession = $("#professions").val();
    const birthdayValue = new Date($("#birthday").val());
    newPlayer.birthday = birthdayValue.getTime();
    newPlayer.banned = $("#isBanned").val();
    newPlayer.level = $("#level").val();
    if (newPlayer.name === "" || newPlayer.title === "" || isNaN(newPlayer.birthday)){
        alert("Required fields not filled")
    } else {
        $.ajax( {
            type: "POST",
            url: "/rest/players",
            data: JSON.stringify(newPlayer),
            contentType: "application/json;charset=utf-8",
            success: function( response ) {
                let currentPage = document.querySelectorAll('.selectedBtn').item(0).id;
                createPageButtons(-1);
                $("#name").val("");
                $("#title").val("");
                $("#level").val(0);
                $("#birthday").val("");
                $("#isBanned").val("false");
                console.log( response );
            }
        });
    }
})