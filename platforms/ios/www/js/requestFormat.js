var data = {
	"baseurl": "https%3A%2F%2Fgriffis.edumedia.ca%2Fmad9022%2Fsteg%2F",
	"methods": [{
		"name": "register",
		"endpoint": "register.php",
		"desc": "create a user account",
		"requires": ["user_name", "email"]
	}, {
		"name": "login",
		"endpoint": "login.php",
		"desc": "login to a user account",
		"requires": ["user_name", "email"]
	}, {
		"name": "listUsers",
		"endpoint": "user-list.php",
		"desc": "get a list of users and their ids. User must be logged in.",
		"requires": ["user_id", "user_guid"]
	}, {
		"name": "listMessages",
		"endpoint": "msg-list.php",
		"desc": "get the list of messages for a user from the queue. User must be logged in",
		"requires": ["user_id", "user_guid"]
	}, {
		"name": "sendMessages",
		"endpoint": "msg-send.php",
		"desc": "upload an image to send to a user. User must be logged in. The image field must be a file.",
		"requires": ["user_id", "user_guid", "recipient_id", "image"]
	}, {
		"name": "getMessage",
		"endpoint": "msg-get.php",
		"desc": "get the single image for the message. User must be logged in.",
		"requires": ["user_id", "user_guid", "message_id"]
	}, {
		"name": "deleteMessage",
		"endpoint": "msg-delete.php",
		"desc": "delete a message and it's image from the queue on the server. User must be logged in.",
		"requires": ["user_id", "user_guid", "message_id"]
	}]
}
