/*****************************************************************
File: User.js
Author: Jake Oh
Description:

Version: 0.0.1
Updated: Apr 22, 2017
- 
*****************************************************************/

function Person (){
	this.email=""
}

function Owner (){
	this.userid=0;
	this.userguid="";
	this.messageQ=[];
}

Owner.prototype = new Person();

var user =null;