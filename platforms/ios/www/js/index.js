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
let gimagepath="";


/***************
For working with Blob from Canvas on iOS Safari

Camera takes pic 
-> saves to local file system 
-> put image from file system into <img> element src attribute
-> put image from <img> element onto <canvas> with drawImage( ) method
-> edit the binary data from the <canvas> to embed message 
-> call canvas.toDataURL( ) to return a base-64 data-url 
-> pass that to dataURLToBlob( ) shown below
-> it returns the Blob which you can pass to fetch

***************/

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

function MessageManipulator() {
	this.encode = function (userID, message, canv) {
		try {
			BITS.setUserId(BITS.numberToBitArray(userID), canv);
			BITS.setMsgLength(BITS.numberToBitArray(message.length), canv);
			BITS.setMessage(message, canv);

			let dataURL = canv.toDataURL("image/png");
			let ret = dataURLToBlob(dataURL);
			return ret;

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
					//console.log("PublicPostman is done " +METHODS[type].name);
				})
		},
		this.reciever = function () {}
}

var PublicpostMan = new Postman();

function PrivatePostman(uid, uguid, email) {
	this.userid = uid;
	this.email = email
	this.userguid = uguid;
	this.localManipulator = new MessageManipulator();
}

PrivatePostman.prototype = new Postman();
PrivatePostman.prototype.sender = function (msgtype, callback) {

	let form = new FormData();
	form.append("user_id", this.userid);
	form.append("user_guid", this.userguid)
	let url = gURL + METHODS[msgtype].endpoint;

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

}
PrivatePostman.prototype.sendPic = function (msgtype, rid, imgblob, fn, callback) {

	let form = new FormData();
	form.append("user_id", this.userid);
	form.append("user_guid", this.userguid)

	form.append("recipient_id", rid);
	form.append("image", imgblob);

	let url = gURL + METHODS[msgtype].endpoint;

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
}

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
	document.getElementById("myTextarea").value="";

}

function onCallbackMessageList(data) {

	console.log("callback " + METHODS[LISTMESSAGES].name + " " + data);

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

					let form = new FormData();
					form.append("user_id", gUid);
					form.append("user_guid", gGuid);
					form.append("message_id", minf.msg_id);
					let url = gURL + METHODS[GETMESSAGE].endpoint;

					let req = new Request(url, {
						method: 'POST',
						mode: 'cors',
						body: form
					})

					let retdata = PublicpostMan.sender(req, onCallbackViewMessage);

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
	myPostMan.sender(LISTUSERS, onCallbackListofName);
}

function onCallbackViewMessage(data) {

	try {
		let viewMessageModal = document.getElementById("ViewMessageModal");
		let messageListModal = document.getElementById("MessageListModal");
		//messageListModal.classList.remove("active");
		//viewMessageModal.classList.add("active");
		let img = document.createElement("img");
		img.src = gURL + data.image;

		let c = document.getElementById("canvas4reciever");

		let ctx = c.getContext('2d');

		img.addEventListener('load', function () {

			//		ctx.drawImage(img1, 0, 0);
			//		
			//		let ms = BITS.getMessage(data.sender, c);
			//		console.log("HERE IS your message: " + ms);
			//		
			//		let user = BITS.numberToBitArray(userID);
			//		BITS.setUserId(user, c);
			//
			//		for (var char = 0; char < message.length; char++) {
			//			BITS.setMessage(BITS.stringToBitArray(message), c);
			//		}

			let id = data.sender.toString();
			//			console.log(glistofuser.get(data.sender.toString()));
			console.log(glistofuser.get(id));

			let fname = document.querySelector("input#sendername");
			fname.value = glistofuser.has(id) ? glistofuser.get(id) : "Anonymous";
			let msg = BITS.getMessage(data.sender, c);

			let text = document.getElementById("rec_message");
			text.value = msg;
		})
	} catch (e) {
		let from = document.querySelector("#Login form");
		app.generateMessage(from, from.firstElementChild, "bad", data.message);
	}

	//let ctx = docment.querySelector("#ViewMessageModal.reciever");
}

function onGoSend(){
	
}
function onleftChevron(){
	
}
function onBackNavFS(){
	
}
function onBackNavFD(){
	
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
			//HTMLHANDLER.generateMessage(e.message, "bad");
		}

	},
	register: function () {
		let baseData = getFormData(REGISTER);
		console.log(baseData.url);

		let req = new Request(baseData.url, {
			method: 'POST',
			mode: 'cors',
			body: baseData.form
		})

		let retdata = PublicpostMan.sender(req, onCallbackLogin);
		console.log(retdata);
	},
	Send: function (ev) {
		ev.preventDefault();

		let canvas = document.querySelector("canvas");

		let rid = document.querySelector("select").value;
		let message = document.getElementById("myTextarea").value;

		let blob = myPostMan.localManipulator.encode(gUid, message, canvas);

		myPostMan.sendPic(SENDMESSAGES, rid, blob, filename, onCallbackSend);

	},
	Delete: function (ev) {
		ev.preventDefault();

		//["user_id", "user_guid", "message_id"]
		myPostMan.sender(DELETEMESSAGE);

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

		// Geting Handler of Buttons
		let lBut = document.getElementById("login");
		let rBut = document.getElementById("register");
		let tBut = document.querySelector("#SendModal form button.btn.btn-primary.btn-block");
		let sBut = document.querySelector("#SendModal form button.btn.btn-positive.btn-block");
		let dBut = document.querySelector("#ViewMessageModal form button.btn.btn-positive.btn-block");

		if ((lBut && 0xff) && (rBut && 0xff)) {
			lBut.addEventListener("touchstart", MessageHandler.login);
			rBut.addEventListener("touchstart", MessageHandler.register);
		};

		// Adding Listener
		tBut.addEventListener('touchstart', app.onCamera);
		sBut.addEventListener('touchstart', MessageHandler.Send);
		dBut.addEventListener('touchstart', MessageHandler.Delete);
		
	
		//Getting Handler for icon
		let goSend = document.querySelector("#MessageListModal a#gosend");
		let leftChev = document.querySelector("#SendModal a#backtoML");
		let backNavFS = document.querySelector("#SendModal a#backtoML");
		let backNavFD = document.querySelector("#ViewMessageModal a#backtoML");
		
		//Setting Nav
		goSend.addEventListener("touchstart",onGoSend);
		leftChev.addEventListener("touchstart",onleftChevron);
		backNavFS.addEventListener("touchstart",onBackNavFS);
		backNavFD.addEventListener("touchstart",onBackNavFD);
		
		//////////////////////////////////////////////////////////////

		let documentForm = document.createElement("script");
		documentForm.addEventListener('load', getJson);
		documentForm.src = "js/requestFormat.js";
		document.body.appendChild(documentForm);
		console.log("called onDeviceReady");
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
		//console.log("successfull." + imageData);

		gimagepath = imageData;
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext('2d');
		canvas.width = "300";
		canvas.height = "300";
		canvas.style.width = "300px";
		canvas.style.height = "300px";

		canvas.classList.add("pic");

		let token = imageData.split('/');
		filename = token[token.length - 1];

		console.log(filename);

		var img1 = document.createElement('img');

		img1.addEventListener('load', function (ev) {
			//image has been loaded
			ctx.drawImage(img1, 0, 0);
			console.log("OK Got it");
			let content = document.getElementById("sendmessage");
			content.appendChild(canvas);
			//
		});
		img1.src = imageData;
		//alternate image source

		//		let img = img.classList.add("mid-thumb");

		//		let modalpad = document.querySelector("#SendModal p.content-padded");

		//		img1.src = imageData;
		img1.style.width = "100%";
		img1.style.height = "100%";

		let form = document.querySelector("#SendModal form");
		form.replaceChild(img1, form.firstElementChild);
	},
	onError: function (message) {
		console.log(message);
		//		app.generateMessage(obj, type = "bad", message);
	},
	generateMessage: function (from, to, type = "bad", message) {
		//let mcontent = window.document.querySelector(node);
		//let mcontentpad = window.document.querySelector('#ReviewModal div.content-padded');
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
		})(from, div), 3210);
	}
};

app.init();
