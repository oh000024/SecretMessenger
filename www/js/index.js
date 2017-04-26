/*****************************************************************
File: index.js
Author: Jake Oh
Description:
Here is the sequence of logic for the app
- Once Device ready, will read localStorage
Version: 0.0.1
Updated: Apr 22, 2017
- Login
*****************************************************************/
// DEFINE ERROR VALUE
"use strict"

const NO_ERROR = 0;
const REGISTER = 0;
const LOGIN = 1;
const LISTUSERS = 2;
const LISTMESSAGES = 3;
const SENDMESSAGES = 4;
const GETMESSAGE = 5;
const DELETEMESSAGE = 6;

var PATTERN = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$/;

let METHODS = [];
let POSTBOX = [];
let gURL = "";
let globalMsgId = 0;
let gGuid = "";
let gUid = 0;
let glistofuser = new Map();
let filename = "";
var myPostMan = null;
let gimagepath = "";
let sname = "";

function dataURLToBlob(dataURL) {
	return Promise.resolve().then(function () {
		var type = dataURL.match(/data:([^;]+)/)[1];
		var base64 = dataURL.replace(/^[^,]+,/, '');
		var buff = binaryStringToArrayBuffer(atob(base64));
		return new Blob([buff], {
			type: type
		});
	});
}

function binaryStringToArrayBuffer(binary) {
	var length = binary.length;
	var buf = new ArrayBuffer(length);
	var arr = new Uint8Array(buf);
	var i = -1;
	while (++i < length) {
		arr[i] = binary.charCodeAt(i);
	}
	return buf;
}

function getJson() {
	gURL = decodeURIComponent(data.baseurl);
	METHODS = data.methods;
}

var blackBox = {
	user_id: "",
	user_guid: "",
	message_id: "",
	recipient_id: "",
	image: ""
}

function MessageManipulator() {
	this.encode = function (userID, message, canv) {
		try {
			let nba = BITS.numberToBitArray(userID);
			canv = BITS.setUserId(nba, canv);
			//let id = BITS.getUserId(canv);

			let nbal = BITS.numberToBitArray(message.length * 16);
			canv = BITS.setMsgLength(nbal, canv);
			//let len = BITS.getMsgLength(canv);

			let stba = BITS.stringToBitArray(message);
			canv = BITS.setMessage(stba, canv);
			//let m = BITS.getMessage(userID, canv);
			//let base64 = canv.toDataURL();
			//let blod = dataURLToBlob(base64);
			let b;
			canv.toBlob(function (blob) {
				b = blob
			}, 'image/png');
			return b;

		} catch (e) {
			console.log("ERROR");
		}
	}
}
//***********************************************************************//
// POSTMAN
//***********************************************************************//
function Postman() {
	this.sender = function (request, callback) {

			fetch(request)
				.then(function (response) {
					return response.json();
				}).then(function (data) {
					callback(data);
				})
		},
		this.reciever = function () {}
}

var PublicpostMan = new Postman();

function PrivatePostman(uid, uguid, email) {
	this.user_id = uid;
	this.email = email
	this.user_guid = uguid;
	this.localManipulator = new MessageManipulator();
}

PrivatePostman.prototype = new Postman();
PrivatePostman.prototype.sender = function (msgtype, callback) {

	try {
		let url = gURL + METHODS[msgtype].endpoint;

		let form = new FormData();
		METHODS[msgtype].requires.forEach(function (value) {
			console.log(value, blackBox[value]);
			if ("image" !== value) {
				form.append(value, blackBox[value]);
			} else {
				form.append(value, blackBox[value], filename);
			}
		})

		let request = new Request(url, {
			method: 'POST',
			mode: 'cors',
			body: form
		})

		fetch(request)
			.then(function (response) {
				return response.json();
			}).then(function (data) {
				callback(data);
				console.log("PrivatePostman is done " + METHODS[msgtype].name);
			})
	} catch (e) {
		console.log(e.message);
	}
}

// Jake!! it is unneccessary.... Find onther
function getFormData(messagetype) {
	try {
		var formElement = document.querySelector("form");
		let form = new FormData(formElement);

		if (!(formElement && 0xff) && !(form && 0xff)) {

			throw new Error("From is Null");
		}

		let username = document.getElementById("user").value;
		let email = document.getElementById("email").value;

		if ((0 == username.length) || (0 == email.length)) {
			throw new Error("Please,enter name and email.");
		}

		let ret = PATTERN.test(email);

		if (!ret) {
			throw new Error("email is invalid");
		}

		form.append("user_name", username); // user_name;
		form.append("email", email); // email
		let url = gURL + METHODS[messagetype].endpoint;
		return {
			form,
			url
		};
	} catch (e) {
		let from = document.querySelector("#Login form");
		app.generateMessage(from, from.firstElementChild, "bad", e.message);
	}
}

//***********************************************************************//
// 
//CallBack Functions
//
//***********************************************************************//
function onRegister(data) {
	console.log("onRegister" + data);
}

function onCallbackListofName(data) {
	try {
		console.log("callback " + METHODS[LISTUSERS].name);
		let select = document.querySelector("select");
		for (let user of data.users) {

			let option = document.createElement("option");
			option.text = user.user_name;
			option.value = user.user_id;
			select.add(option);
			glistofuser.set(user.user_id, user.user_name);
		}

	} catch (e) {

		console.log(e.message);
	}
}

function onCallbackLogin(data) {
	try {
		console.log("callback   " + METHODS[LOGIN].name);
		if (NO_ERROR == data.code) {
			let form = new FormData();
			form.append("user_id", data.user_id);
			form.append("user_guid", data.user_guid);
			let url = gURL + METHODS[LISTMESSAGES].endpoint;

			gGuid = data.user_guid;
			gUid = data.user_id;

			blackBox.user_guid = data.user_guid;
			blackBox.user_id = data.user_id;

			let req = new Request(url, {
				method: 'POST',
				mode: 'cors',
				body: form
			})

			// Setting postman with uid uguid
			myPostMan = new PrivatePostman(gUid, gGuid);
			PublicpostMan.sender(req, onCallbackMessageList);

		} else {
			throw new Error(data.message);
		}
	} catch (e) {
		let from = document.querySelector("#Login form");
		app.generateMessage(from, from.firstElementChild, "bad", data.message);
	}
}

function onCallbackSend(data) {
	console.log("callback  " + METHODS[LOGIN].name);
	let rid = document.querySelector("select").value;
	document.getElementById("myTextarea").value = "";

	let from = document.querySelector("#sendmessage div#msg4.content-padded");
	app.generateMessage(from, from.firstElementChild, "info", data.message);

}

function onCallbackMessageList(data) {

	console.log("callback " + METHODS[LISTMESSAGES].name + " " + data);

	// What is it? Jake!! what is your intention.... 
	POSTBOX = data.messages;
	let messageListModal = document.getElementById("MessageListModal");
	let ul = document.querySelector(".table-view");
	ul.innerHTML = "";
	try {
		let users = data.messages;
		for (let message of data.messages) {
			//this.createHtml4Peple(msg);

			let li = document.createElement("li");
			let spanName = document.createElement("span");
			let aName = document.createElement("a");

			li.classList.add("table-view-cell");
			spanName.classList.add("name");

			aName.href = "#ViewMessageModal";
			aName.textContent = "Message From: " + message.user_name;

			aName.classList.add("navigate-right", "pull-right");

			let att = document.createAttribute("msg-id");
			att.value = message.msg_id;
			aName.setAttributeNode(att);
			aName.addEventListener("touchstart", (function (minf, u, l) {
				return function (id) {
					//"requires": ["user_id", "user_guid", "message_id"]
					//var a = ev.currentTarget;
					globalMsgId = aName.getAttribute("msg-id");
					blackBox.message_id = globalMsgId;

					let retdata = myPostMan.sender(GETMESSAGE, onCallbackViewMessage);

				}
			})(message, ul, li));

			spanName.appendChild(aName);
			li.appendChild(spanName);
			ul.appendChild(li);
		}

	} catch (e) {
		alert(e.message);
	}
	console.log("Active MessageLisgt");
	messageListModal.classList.add("active");
	let viewMessageModal = document.getElementById("ViewMessageModal");
	viewMessageModal.classList.remove("active");
	viewMessageModal.focus();
	myPostMan.sender(LISTUSERS, onCallbackListofName);

}

function onCallbackViewMessage(data) {

	try {
		let viewMessageModal = document.getElementById("ViewMessageModal");
		let messageListModal = document.getElementById("MessageListModal");

		let canvas = document.createElement("canvas");
		let img = document.getElementById("canvas4reciever");
		img.src = gURL + data.image;

		let ctx = canvas.getContext('2d');

		//		img.src = gURL + data.image;
		img.addEventListener('load', function () {
			canvas.style.width = img.width + "px";
			canvas.style.height = img.height + "px";
			canvas.width = img.width; //"300";
			canvas.height = img.height; //"300";
			ctx.drawImage(img, 0, 0);
			//img.style.width = "100%";


			//try {

			let id = data.sender.toString();
			//			console.log(glistofuser.get(data.sender.toString()));
			console.log(glistofuser.get(id));

			let fname = document.querySelector("input#sendername");
			fname.value = glistofuser.has(id) ? glistofuser.get(id) : "Anonymous";
			sname = fname.value;
			let msg = BITS.getMessage(gUid, canvas);

			let text = document.getElementById("recievedmsg");
			text.value = msg;

			//} catch (e) {
			//	let from = document.querySelector("#viewmessage form");
			//				app.generateMessage(from, from.firstElementChild, "bad", e.message);
			//}
		})
	} catch (e) {
		let from = document.querySelector("#viewmessage form");
		//		app.generateMessage(from, from.firstElementChild, "bad", data.message);
	}

	//let ctx = docment.querySelector("#ViewMessageModal.reciever");
}

function onCallbackDelete(data) {
	//	PublicpostMan.sender(req, onCallbackMessageList);
	let from = document.querySelector("#viewmessage div#msg4.content-padded");
	app.generateMessage(from, from.firstElementChild, "info", data.message);

	setTimeout(function () {
		myPostMan.sender(LISTMESSAGES, onCallbackMessageList);
	}, 500);
}

// For Nav button
function onGoSend(ev) {
	ev.preventDefault();
	let tBut = document.querySelector("#SendModal form button.btn.btn-primary.btn-block");
	tBut.addEventListener('touchstart', app.onCamera);

}

function onBackNavFS(ev) {
	ev.preventDefault();
	let select = document.querySelector("select");
	select.selectedIndex = 0;
	let but = document.createElement("button");
	but.classList.add("btn", "btn-primary", "btn-block");
	but.textContent = "TAKE A PICTURE";
	//	but.innerHTML="<button class="btn btn-primary btn-block">TAKE A PICTURE</button>"
	document.getElementById("myTextarea").value = "";
	let form = document.querySelector("#SendModal form");
	let img = document.querySelector("#SendModal img");
	form.replaceChild(but, form.firstElementChild);
}

function onBackNavFD(ev) {
	ev.preventDefault();
	

}

function onGoSendWId(ev) {
	//ev.preventDefault();

	let select = document.querySelector("select");

	for (var i = 0; i < select.options.length; i++) {
		if (select.options[i].text === sname) {
			select.selectedIndex = i;
			break;
		}
	}
	// Is this the Best thing?? Jake??? 
	//sname = "";
	document.getElementById("myTextarea").focus();

	let tBut = document.querySelector("#SendModal form button.btn.btn-primary.btn-block");
	tBut.addEventListener('touchstart', app.onCamera);
}

var MessageHandler = {
	login: function (ev) {
		ev.preventDefault();

		console.log("Login");
		try {

			let baseData = getFormData(LOGIN);
			console.log(baseData.url);

			let req = new Request(baseData.url, {
				method: 'POST',
				mode: 'cors',
				body: baseData.form
			})

			PublicpostMan.sender(req, onCallbackLogin);
			console.log("return");

		} catch (e) {
			console.log(e.message);
		}
	},
	register: function (ev) {
		try {
			ev.preventDefault();
			let baseData = getFormData(REGISTER);
			console.log(baseData.url);

			let req = new Request(baseData.url, {
				method: 'POST',
				mode: 'cors',
				body: baseData.form
			})

			let retdata = PublicpostMan.sender(req, onCallbackLogin);
			console.log(retdata);
		} catch (e) {
			console.log(e.message);
		}
	},
	Send: function (ev) {
		try {
			ev.preventDefault();

			let canvas = document.createElement("canvas");
			let ctx = canvas.getContext('2d');
			//			canvas.width = "300";
			//			canvas.height = "300";
			//			canvas.style.width = "300px";
			//			canvas.style.height = "300px";

			var w = img1.width;
			var h = img1.height;
			canvas.style.width = w + 'px';
			canvas.style.height = h + 'px';
			canvas.width = w;
			canvas.height = h;

			canvas.classList.add("pic");
			let img1 = document.querySelector(".orgimg");
			if (img1.src == null) {
				throw new Error("There is an error of picture");
			}
			ctx.drawImage(img1, 0, 0); //Step3

			//let canvas = document.querySelector("canvas");

			let rid = document.querySelector("select").value;
			let message = document.getElementById("myTextarea").value;

			if (!(0xff && message)) {
				throw new Error("Please,enter your message");
			}
			// Ste4 and Stemp5
			let blob = myPostMan.localManipulator.encode(rid, message, canvas);

			//canvas.toDataURL( );
			blackBox.image = blob;
			blackBox.recipient_id = rid;

			myPostMan.sender(SENDMESSAGES, onCallbackSend);
		} catch (e) {
			//console.log(e.message);
			let from = document.querySelector("#sendmessage form");
			app.generateMessage(from, from.firstElementChild, "bad", e.message);
		}

	},
	Delete: function (ev) {
		try {
			ev.preventDefault();
			blackBox.message_id = globalMsgId;

			let from = document.querySelector("#viewmessage form");

			myPostMan.sender(DELETEMESSAGE, onCallbackDelete)

		} catch (e) {
			conole.log(e.mesasage);
		}
	},
	onSuccess: function (data) {

	},
	getMessage: function () {

	}
}
var app = {
	localNote: null,
	init: function () {
		try {

			document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
		} catch (e) {
			document.addEventListener('DOMContentLoaded', this.onDeviceReady.bind(this), false);
			console.log('failed to find deviceready');
		}
	},
	onDeviceReady: function () {

		try {
			// Geting Handler of Buttons
			let lBut = document.getElementById("login");
			let rBut = document.getElementById("register");
			//let tBut = document.querySelector("#SendModal form button.btn.btn-primary.btn-block");
			let sBut = document.querySelector("#SendModal form button.btn.btn-positive.btn-block");
			let dBut = document.querySelector("#ViewMessageModal form button.btn.btn-positive.btn-block");

			if ((lBut && 0xff) && (rBut && 0xff)) {
				lBut.addEventListener("touchstart", MessageHandler.login);
				rBut.addEventListener("touchstart", MessageHandler.register);
			};

			// Adding Listener
			//tBut.addEventListener('touchstart', app.onCamera);

			sBut.addEventListener('touchstart', MessageHandler.Send);
			dBut.addEventListener('touchstart', MessageHandler.Delete);

			//Getting Handler for icon
			let goSend = document.querySelector("#MessageListModal a#gosend");
			let goSendwidhID = document.querySelector("#ViewMessageModal a#gosend");

			let backNavFS = document.querySelector("#SendModal a#backtoML");
			let backNavFD = document.querySelector("#ViewMessageModal a#backtoML");

			//Setting Listener of Navs
			goSend.addEventListener("touchstart", onGoSend);
			backNavFS.addEventListener("touchstart", onBackNavFS);
			backNavFD.addEventListener("touchstart", onBackNavFD);
			goSendwidhID.addEventListener("touchstart", onGoSendWId);

			//////////////////////////////////////////////////////////////

			let documentForm = document.createElement("script");
			documentForm.addEventListener('load', getJson);
			documentForm.src = "js/requestFormat.js";
			document.body.appendChild(documentForm);
			console.log("called onDeviceReady");
		} catch (e) {
			console.log(e.message);
		}
	},

	onCancel: function (m) {

	},

	onCamera: function (ev) {
		ev.preventDefault();
		console.log("Operating a camera");

		var options = {
			quality: 60,
			destinationType: Camera.DestinationType.FILE_URI,
			encodingType: Camera.EncodingType.PNG,
			mediaType: Camera.MediaType.PICTURE,
			pictureSourceType: Camera.PictureSourceType.CAMERA,
			allowEdit: true,
			targetWidth: 300,
			targetHeight: 300
		};
		navigator.camera.getPicture(app.onSuccess, app.onError, options);
	},

	onSuccess: function (imageData) {
		try {

			gimagepath = imageData;

			let token = imageData.split('/');
			filename = token[token.length - 1];

			//console.log(filename);

			var img1 = document.createElement('img');
			img1.classList.add("orgimg");
			img1.style.width = "100%";
			img1.style.height = "100%";
			img1.src = imageData; //Step 2


			//ctx.drawImage(img1, 0, 0); //Step3

			let form = document.querySelector("#SendModal form");
			form.replaceChild(img1, form.firstElementChild);
			//form.appendChild(canvas);
		} catch (e) {
			console.log(e.message);
		}
	},
	onError: function (message) {
		console.log(message);
		//		app.generateMessage(obj, type = "bad", message);
	},
	generateMessage: function (from, to, type = "bad", message) {
		try {
			let div = document.createElement('div');

			div.classList.add('msg');
			setTimeout(function () {
				div.classList.add(type);
			}, 20); //delay before adding the class to trigger transition

			div.textContent = message === null ? "Unknown Error" : message;

			from.insertBefore(div, to);

			setTimeout((function (m, d) {
				return function () {
					m.removeChild(d);
				}
			})(from, div), 1500);
		} catch (e) {

		}
	},
	generateMMessage: function (from, to, type = "bad", message) {
		try {
			let div = document.createElement('div');

			div.classList.add('msg');
			setTimeout(function () {
				div.classList.add(type);
			}, 20); //delay before adding the class to trigger transition

			div.textContent = message === null ? "Unknown Error" : message;

			from.insertBefore(div, to);

			setTimeout((function (m, d) {
				return function () {
					m.removeChild(d);
				}
			})(from, div), 1500);
		} catch (e) {

		}
	}
};

app.init();
