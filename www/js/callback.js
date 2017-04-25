


function onRegister(data) {
	console.log("onRegister" + data);
}

function onListofName(data) {
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


function onLogin(data) {
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
		let retdata = PublicpostMan.sender(req, onMessageList);

	}
}

function onSend(data) {
	console.log("callback  " + METHODS[LOGIN].name)
}

function onMessageList(data) {

	console.log("callback " + METHODS[LISTMESSAGES].name + " " + data);

	POSTBOX = data.messages;
	let messageListModal = document.getElementById("MessageListModal");
	ul = document.querySelector(".table-view");
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
			aName.addEventListener("touchstart", (function (minf) {
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

					let retdata = PublicpostMan.sender(req, onViewMessage);

				}
			})(message));

			spanName.appendChild(aName);

			li.appendChild(spanName);

			ul.appendChild(li);
		}
		
	} catch (e) {
		alert(e.message);
	}
	console.log("Active MessageLisgt");
	messageListModal.classList.add("active");
	myPostMan.sender(LISTUSERS, onListofName);
}

function onViewMessage(data) {
	console.log(data);
	console.trace(data);
	console.debug(data);
	let viewMessageModal = document.getElementById("ViewMessageModal");
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

		let msg = BITS.getMessage(data.sender, c);

		let text = document.getElementById("rec_message");
		text.value = msg;
	})


	//let ctx = docment.querySelector("#ViewMessageModal.reciever");

}