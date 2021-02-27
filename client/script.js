let titles = [
    "La différence entre une bière et un chasseur, c'est que la bière, ils la font sans alcool...",
    "L'alcool ne résout pas les problèmes, mais l'eau et le lait non plus.",
    "L'alcool tue lentement. On s'en fout. On n'est pas pressés.",
    "L'eau ça fait rouiller",
    "L'alcool ça décape",
    "En dessous de 19 c'est du soft"
]

let alcoolList = []
let user = {};

const URL = "https://lhlawliet.xyz:3000";
const socket = io(URL);


socket.on("connect", () => {
    console.log(socket.connected); // true
    socket.emit("refreshList", "[]");
});

socket.on("refreshList", (data) => {
    for (const element of data) {
        element.score = (element.alcoolRatio*element.volume)/element.price
    }
    alcoolList = rankList(data)

    let i = 1;

    for (const element of data) {
        element.rank = i
        i++
    }

    console.log(alcoolList)

    updateTable(alcoolList)
});


socket.on("notify", (text) => {
    M.toast({html: text, classes: 'rounded red'});
});

socket.on("registerValidated", (data) => {
    data = JSON.parse(data)
    user = data;
    updateConnectionButton()
    hideRegister()
});

socket.on("connectValidated", (data) => {
    data = JSON.parse(data)
    user.token = data.token;
    console.log("C'EST VALIDÉ")
    updateConnectionButton();
    hideConnect();
});


function updateConnectionButton() {
    if (user.token) {
        $('#addAlcoolContainer').show()
        $('#connectButtonHolder').html('<li><a id="connect" class="waves-effect waves-light btn" onclick="disconnectButton();">Se déconnecter <i class="material-icons right">person</i></a></li>')
        if (user.admin == 1) {
            $('#admin').show()
        }
    } else {
        $('#addAlcoolContainer').hide()
        $('#admin').hide()
        $('#connectButtonHolder').html('<li><a id="connect" class="waves-effect waves-light btn" onclick="connectButton();">Se connecter <i class="material-icons right">person</i></a></li>')
    }
}


function tryToConnectButton() {
    let username = $("#usernameLoginInput").val();
    let password = $("#passwordLoginInput").val();

    if (username == "") {
        M.toast({html: 'Le champ "nom d\'utilisateur" ne peux pas être vide!', classes: 'rounded red'});
        return
    }
    if (password = "") {
        M.toast({html: 'Le champ "mot de passe" ne peux pas être vide!', classes: 'rounded red'});
        return
    }

    socket.emit("tryConnect", JSON.stringify({username: username, password:password}));
}


function disconnectButton() {
    user.token = null;
    updateConnectionButton() 
}

socket.onAny((event, ...args) => {
    console.log(event, args);
});

function randomInt(min, max) {
    return Math.floor((Math.random() * max) + min);
}

function randomTitle() {
    return titles[randomInt(0, titles.length)]
}


function connectButton() {
    $("#Login").show();
    blurApp(true);
}

function hideConnect() {
    $("#Login").hide();
    $("#usernameLoginInput").val("");
    $("#usernamePasswordInput").val("");
    blurApp(false);
}


function goToRegister() {
    $("#Login").hide();
    $("#Register").show();
}

function hideRegister() {
    $("#Register").hide();
    $("#usernameRegisterInput").val("");
    $("#emailRegisterInput").val("");
    $("#passwordRegisterInput").val("");
    $("#passwordValidationRegisterInput").val("");
    blurApp(false);
}

function tryToRegister() {

    let username = $("#usernameRegisterInput").val();
    let email = $("#emailRegisterInput").val();
    let password = $("#passwordRegisterInput").val();
    let passwordValidation = $("#passwordValidationRegisterInput").val();

    if (username == "") {
        M.toast({html: 'Aucun nom d\'utilisateur choisis!', classes: 'rounded red'});
        return
    }
    if (email == "") {
        M.toast({html: "Aucune email choisis!", classes: 'rounded red'});
        return
    }
    if (password = "") {
        M.toast({html: "Aucun mot de passe choisis!", classes: 'rounded red'});
        return
    }
    if (passwordValidation = "") {
        M.toast({html: "Merci de remplir le champs de validation de mot de passe!", classes: 'rounded red'});
        return
    }
    if (password != passwordValidation) {
        M.toast({html: "Les mots de passes ne correspondent pas!", classes: 'rounded red'});
        return
    }

    socket.emit("wannaRegister", JSON.stringify({username: username, email:email, password:password}));
    //removeNewAlcool();
}

function blurApp(state) {
    if (state) {
        $("#app").css({
            'filter'         : 'blur(6px)',
            '-webkit-filter' : 'blur(6px)',
            '-moz-filter'    : 'blur(6px)',
            '-o-filter'      : 'blur(6px)',
            '-ms-filter'     : 'blur(6px)'
        });
    } else {
        $("#app").css({
            'filter'         : 'blur(0px)',
            '-webkit-filter' : 'blur(0px)',
            '-moz-filter'    : 'blur(0px)',
            '-o-filter'      : 'blur(0px)',
            '-ms-filter'     : 'blur(0px)'
        });
    }
}


function imAdult() {
    $("#warnBox").hide();
    blurApp(false);
}

function requestNewAlcool() {
    console.log("OUI DONNE MOI A BOIRE");
    $("#RequestNewAlcool").show();
    blurApp(true);
}

$(document).ready(function(){
    $("#Title").text(randomTitle());
});


function rankList(list) {
    list.sort(function(a, b) { 
        return b.score - a.score;
    })
    return list
}

function updateTable(sortedList) {
    let code = ""
    for (element of sortedList) {
        console.log(element)
        code += "<tr><td>"+element.rank+"</td><td>"+element.name+"</td><td>"+element.score+"</td><td>"+element.alcoolRatio+"%</td><td>"+element.volume+"l</td><td>"+element.price+"€</td><td>"+element.category+"</td>"
        if (element.source) {
            code += "<td> <a href="+element.source+">source</a></td>"
        }
        code += "</tr>\n"
    }
    $("#AlcoolElements").html(code)

    return 
}


function addNewAlcool() {
    let alcoolName = $("#alcoolName").val();
    let alcoolRatio = $("#alcoolRatio").val();
    let volume = $("#volume").val();
    let price = $("#price").val();
    let source = $("#source").val();

    const rbs = document.querySelectorAll('input[name="category"]');
    let category;
    for (const rb of rbs) {
        if (rb.checked) {
            category = rb.value;
            break;
        }
    }
    console.log(category)

    alcoolRatio = parseFloat(alcoolRatio);
    volume = parseFloat(volume);
    price = parseFloat(price);
    if (alcoolName == "") {
        M.toast({html: 'Aucun nom choisis!', classes: 'rounded red'});
        return
    }
    if (!alcoolRatio || alcoolRatio<0 || alcoolRatio>=100) {
        M.toast({html: "Valeur de la teneur en alcool incorrecte!", classes: 'rounded red'});
        return
    }
    if (!volume || volume<0) {
        M.toast({html: "Valeur du volume incorrecte!", classes: 'rounded red'});
        return
    }
    if (!price || price<0) {
        M.toast({html: "Valeur de prix incorrecte!", classes: 'rounded red'});
        return
    }

    socket.emit("requestNewAlcool", JSON.stringify({alcoolName: alcoolName, token: user.token, alcoolRatio:alcoolRatio, volume:volume, price:price, category:category, source:source}));
    removeNewAlcool();
}

function removeNewAlcool() {
    $("#alcoolName").val("");
    $("#alcoolRatio").val("");
    $("#volume").val("");
    $("#price").val("");
    $("#source").val("");
    $("#RequestNewAlcool").hide();
    blurApp(false);
}

console.log("C'EST L'HEURE DE BOIRE")