import * as L from "leaflet/dist/leaflet-src.esm.js"
import io from 'socket.io-client'


// chatbox
const messageInput = document.getElementById('message-input')
const form = document.getElementById("form")

form.addEventListener('submit', e => {
    e.preventDefault()
    const message = messageInput.value

    if (message === "") return
    displayMessageSend(message)
    socket.emit('send-message', message)
})

function displayMessageSend(message) {
    const div = document.createElement("p")
    div.classList.add("send")
    div.textContent = message
    document.getElementById("message-container").append(div)
}



function displayMessageReceive(message) {
    const div = document.createElement("p")
    div.classList.add("receive")
    div.textContent = message
    document.getElementById("message-container").append(div)
}



let macarte;
let coordsUser;
// icones
var IconRestaurant = L.icon({
    iconUrl: '/img/restaurant.png',

    iconSize: [35, 35], // size of the icon
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var IconFinish = L.icon({
    iconUrl: '/img/finish.png',

    iconSize: [35, 35], // size of the icon
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var IconUsers = L.icon({
    iconUrl: '/img/users.png',

    iconSize: [35, 35], // size of the icon
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

let name = "Anonyme";
let depart = [48.843523789371154, 2.285988810800521];
let restaurant = [48.843523789371154, 2.285988810800521];
let restaurantMap = [
    {
        "lat": 48.84419446094281,
        "long": 2.342391792833065
    },
    {
        "lat": 48.888754946386406,
        "long": 2.3297996991764607
    },
    {
        "lat": 48.89304387272991,
        "long": 2.331172990098648
    }
];

function restau(lati, lngi) {
    restaurant = [lati, lngi]
    macarte.remove();
    initMap();
}


let currentUser = [
    {
        "name": name,
        "depart": depart,
        "restaurant": restaurant,
        "time": 0,
        "id": "0",
        "room": "",
    },
]

let nextUsers = [

]

let allUsers = [];

function allUser() {
    allUsers = [];
    currentUser.forEach(element => {
        allUsers.push(element)
    })
    nextUsers.forEach(element => {
        allUsers.push(element)
    })
}

allUser()


let finish = [48.8512, 2.349903]

nameNextUser()

function nameNextUser() {
    for (let i = 0; i < nextUsers.length; i++) {
        document.getElementById('nameNextUsers').innerHTML += '<li id="timeStart' + [i + 1] + '" data-id="' + nextUsers[i].id + '">' + nextUsers[i].name + '</li>';
    }
}
function changeNameList(user) {
    let li = document.querySelectorAll('[data-id]')
    li.forEach(li => {
        if (li.getAttribute('data-id') === user.id) {
            li.innerHTML = user.name
        }
    })
}
function resetNameList() {
    let li = document.querySelectorAll('[data-id]')
    li.forEach((li) => {
        li.remove()
    })
}

function removeName(userId) {
    let li = document.querySelectorAll('[data-id]')
    li.forEach(li => {
        if (li.getAttribute('data-id') === userId) {
            li.remove()
        }
    })
}
let myRoom

let Room = document.getElementById('joinRoom')
Room.addEventListener("click", function () {
    myRoom = document.getElementById('myRoom').value
    document.getElementById('roomId').innerHTML = 'Room n° ' + myRoom;
    currentUser[0].room = myRoom
    socket.emit('join', myRoom)
}, false)

let leaveRoom = document.getElementById('leaveRoom')
leaveRoom.addEventListener('click', function () {
    let Room = document.getElementById('myRoom')
    Room.value = "";
    let lastRoom = currentUser[0].room
    currentUser[0].room = "";
    socket.emit('leaveRoom', lastRoom, currentUser[0])
    currentUser[0].room = ""
}, false)

// Fonction d'initialisation de la carte
function initMap() {
    let lat = finish[0]
    let lng = finish[1]
    var polylines = [];

    let markerPosition = [];
    let markerPositionR = []

    let changeName = document.getElementById('myName')
    changeName.addEventListener("change", function () {
        name = document.getElementById('myName').value
        currentUser[0].name = document.getElementById('myName').value;



        if (currentUser[0].name != "") {
            CurrentName();
            markerPosition.forEach(element => {
                macarte.removeLayer(element)
            })
            markers();

            socket.emit('nameChange', currentUser[0])
        } else {
            name = "Anonyme"
            currentUser[0].name = "Anonyme"
            CurrentName();
            markerPosition.forEach(element => {
                macarte.removeLayer(element)
            })
            markers();

            socket.emit('nameChange', currentUser[0])
        }

    })


    let button = document.querySelectorAll('.button')
    let buttonItems;
    buttonItems = [].slice.call(button);
    buttonItems.forEach(function (item, idx) {
        item.addEventListener('click', function () {
            restaurant = [restaurantMap[idx].lat, restaurantMap[idx].long]
            currentUser[0].restaurant = restaurant;

            let remove = document.querySelectorAll('.button')
            remove.forEach(element => {
                element.style.backgroundColor = 'black'
            })

            item.style.backgroundColor = 'red'

            macarte.remove()
            initMap()
            algoDistance()
            socket.emit('restauChange', currentUser[0])
        }, false);
    });

    CurrentName()

    function CurrentName() {
        document.getElementById('currentIdName').innerHTML = name;

    }

    // Créer l'objet "macarte" et l'insèrer dans l'élément HTML qui a l'ID "map"
    macarte = L.map('map').setView([lat, lng], 11);
    // point d'arrivé
    let marker = L.marker([lat, lng], {
        draggable: true,
        autoPan: true,
        icon: IconFinish
    }).addTo(macarte);


    marker.on('dragend', function (e) {
        lat = marker.getLatLng().lat;
        lng = marker.getLatLng().lng;
        finish = [marker.getLatLng().lat, marker.getLatLng().lng]


        polylines.forEach(element => {
            macarte.removeLayer(element)
        })
        line()
        socket.emit('changeFinish', finish, currentUser[0].room);
        algoDistance()
    });

    // Leaflet ne récupère pas les cartes (tiles) sur un serveur par défaut. Nous devons lui préciser où nous souhaitons les récupérer. Ici, openstreetmap.fr
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        // Il est toujours bien de laisser le lien vers la source des données
        attribution: 'données © OpenStreetMap/ODbL - rendu OSM France',
        minZoom: 1,
        maxZoom: 20
    }).addTo(macarte);


    line()
    function line() {
        nextUsers.forEach(e => {
            polylines.push(L.polyline([[e.depart[0], e.depart[1]], [e.restaurant[0], e.restaurant[1]], [lat, lng]], { color: 'red' }).addTo(macarte))
        })

        currentUser.forEach(e => {
            if (restaurant[0] === 48.843523789371154) {
                polylines.push(L.polyline([[e.depart[0], e.depart[1]], [restaurant[0], restaurant[1]], [lat, lng]], { color: 'red' }).addTo(macarte))
            } else {
                polylines.push(L.polyline([[e.depart[0], e.depart[1]], [restaurant[0], restaurant[1]], [lat, lng]], { color: 'red' }).addTo(macarte))
            }

        })

    }

    markers();

    function markers() {
        // Nous parcourons la liste des villes
        nextUsers.forEach(e => {

            markerPosition.push(L.marker([e.depart[0], e.depart[1]], { icon: IconUsers }).addTo(macarte).bindTooltip(e.name + '<br/>',
                {
                    permanent: true,
                    direction: 'right'
                }));
            markerPositionR.push(L.marker([e.restaurant[0], e.restaurant[1]], { icon: IconRestaurant }).addTo(macarte).bindPopup(e.name));

        });

        currentUser.forEach(e => {
            markerPosition.push(L.marker([e.depart[0], e.depart[1]], { icon: IconUsers }).addTo(macarte).bindTooltip(name + '<br/>',
                {
                    permanent: true,
                    direction: 'right'
                }));
            if (restaurant[0] !== '48.843523789371154') {
                markerPositionR.push(L.marker([restaurant[0], restaurant[1]], { icon: IconRestaurant }).addTo(macarte).bindPopup(name));
            }

        })

    }

}

function getPosition() {
    return new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej);
    });
}


function algoDistance() {
    const meetTime = new Date();
    meetTime.setHours(13)
    meetTime.setMinutes(0);
    meetTime.setSeconds(0)
    const vitesse = 5;
    let timesstart = [];

    function getDistance(user, finish) {
        return macarte.distance(user, finish)
    }

    function getDistanceUserFinish(user) {
        let userPos = user.depart;
        let restoPos = user.restaurant;
        let userRestaurant = getDistance(userPos, restoPos)
        let restoFinish = getDistance(restoPos, finish);
        let totalD = userRestaurant + restoFinish;
        return (totalD / 1000)
    }

    function getTime(distance) {
        let time = (distance / vitesse) * 3600
        return time
    }

    function getTimeToLeave(time, meetTime) {
        let newDate = new Date(meetTime.getTime() - time * 1000)
        return newDate
    }

    function timeUser() {
        allUsers.forEach((user) => {
            let distance = getDistanceUserFinish(user);
            let time = getTime(distance);
            let departTime = getTimeToLeave(time, meetTime)
            console.log(user.name + " doit partir à " + departTime)
            timesstart.push(departTime)
        })

        let li = document.querySelectorAll('[data-id]')
        li.forEach(user => {
            for (let i = 0; i < nextUsers.length; i++) {
                document.getElementById('timeStart' + [i + 1]).innerHTML = nextUsers[i].name + '<br>Doit partir à ' + timesstart[i + 1].toLocaleTimeString() + ' pour arriver à 13h'
            }
        })
        document.getElementById('nameId').innerHTML = '<span id="currentIdName">' + currentUser[0].name + '</span> </br> Doit partir à ' + timesstart[0].toLocaleTimeString() + ' pour arriver à 13h'

    }

    timeUser()

}





const socket = io('http://localhost:3000')

// chatbox

socket.on('receive-message', message => {
    displayMessageReceive(message)
})

socket.on("connect", connectedUsers => {
    currentUser[0].id = socket.id
    getPosition().then((res) => {
        coordsUser = [res.coords.latitude + (Math.random(0.1) / 10), res.coords.longitude + (Math.random(0.1) / 10)];
        currentUser[0].depart = coordsUser;
        // currentUser[0].restaurant = coordsUser;
        socket.emit('newUser', currentUser)
        initMap();
        algoDistance()
    });
})

socket.on('allUsers', (users, room) => {
    if (currentUser[0].room === "") {
        nextUsers = [];
        users.forEach(user => {
            if (user.id !== currentUser[0].id) {
                nextUsers.push(user)
            }
        })
        allUser()
        macarte.remove();
        initMap();
        let clearLi = document.querySelectorAll('[data-id]');
        clearLi.forEach(li => { li.remove() });
        nameNextUser()
        algoDistance()
    }
})

socket.on('userRoom', (users, room) => {
    console.log(room)
    if (currentUser[0].room === room) {
        nextUsers = [];
        users.forEach(user => {
            if (user.id !== currentUser[0].id) {
                nextUsers.push(user)
            }
        })
        allUser()
        resetNameList()
        nameNextUser()
        macarte.remove();
        initMap();
        algoDistance()
    }
})


socket.on('changeFinish', (finishPoint, room) => {
    finish = finishPoint;
    macarte.remove()
    initMap()
    algoDistance()
})

socket.on('nameChange', updatedUser => {
    nextUsers.forEach(user => {
        if (user.id === updatedUser.id) {
            user.name = updatedUser.name
        }
    })
    changeNameList(updatedUser)
    macarte.remove()
    initMap()
    algoDistance()
})
socket.on('roomChangeInfo', updatedUser => {
    nextUsers.forEach(user => {
        if (user.id === updatedUser.id) {
            user.room = updatedUser.room
        }
    })
    changeNameList(updatedUser)
})

socket.on('restauChange', updatedUser => {
    nextUsers.forEach(user => {
        if (user.id === updatedUser.id) {
            user.restaurant = updatedUser.restaurant
        }
    })
    macarte.remove()
    initMap()
})

socket.on('removeName', removeNameId => {
    removeName(removeNameId)
    macarte.remove()
    initMap()
})







