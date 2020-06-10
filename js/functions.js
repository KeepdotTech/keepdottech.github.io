var user_info_global;
var current_user_global;

function initialize(){
firebase.auth().onAuthStateChanged(function(user) {
 if (user) {
	console.log('Signed In');
	firebase.database().ref('/user_info/' + user.uid).once('value', function(snapshot) { 
		if(snapshot.val().hasOwnProperty('admin')){
			update_admin();
		}else{
			update_user(user.uid);
		}

	 });

	document.getElementById('dash').scrollIntoView();
	} else {
	console.log('No user detected');

	var loginbutton = document.getElementById("button-login");
	loginbutton.style.display='block';

	}
});

}



function getEmailSignInMethod() {
  var config = parseQueryString(location.hash);
  return 'password';
}


function parseQueryString(queryString) {
  // Remove first character if it is ? or #.
  if (queryString.length &&
      (queryString.charAt(0) == '#' || queryString.charAt(0) == '?')) {
    queryString = queryString.substring(1);
  }
  var config = {};
  var pairs = queryString.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    if (pair.length == 2) {
      config[pair[0]] = pair[1];
    }
  }
  return config;
}


function setValue(id,value){
	 let temp=document.getElementById(id);
	 temp.innerHTML=value;
}

function signOut(){
	firebase.auth().signOut().then(function() {
	  console.log("Signed Out");
	  // Sign-out successful.
	  location.reload();

	}).catch(function(error) {
	  // An error happened.
	});
}

function update_user(given_uid){
current_user_global=given_uid;
document.getElementById('dash').scrollIntoView();

if(given_uid.length!=28){
	console.log('Received invalid user id');
	var user = firebase.auth().currentUser;
	uid=user.uid;
}
else{
	uid=given_uid;
}
var page1 = document.getElementById("container-welcome");
page1.style.display='block';

var page2 = document.getElementById("container-login");
page2.style.display='none';

var loginbutton = document.getElementById("button-login");
loginbutton.style.display='none';

var page3 = document.getElementById("main-outer-section");
page3.style.display='block';



var database = firebase.database();
var username;
var useremail;
var userphone;
var usermac;

var userId = uid;

database.ref('/user_info/' + userId).on('value', function(snapshot) {  
  //set user account
  console.log(snapshot.val());
  username = (snapshot.val() && snapshot.val().name) || 'Anonymous';
  setValue('username',username);
  useremail=(snapshot.val() && snapshot.val().email) || 'undefined';
  setValue('useremail',useremail);
  userphone = (snapshot.val() && snapshot.val().phone) || 'Anonymous';
	  setValue('userphone',userphone);
  usermac=(snapshot.val() && snapshot.val().hw_addr) || 'undefined';
  setValue('usermac',usermac);
	
  
  //set control
  let status=(snapshot.val() && snapshot.val().alarm) || 'undefined';
  if(status=='true'){
  	console.log('Alarm ON');
  	setValue('status','Alarm is on');
  	document.getElementById("alarmdiv").style.display='block';
  }
  else{
  	console.log('Alarm OFF');
 	setValue('status','Alarm is off');
  	document.getElementById("alarmdiv").style.display='none';
  }

  //set map
  let pos=(snapshot.val() && snapshot.val().position) || 'undefined';
  if(pos!='undefined'){
  	let x=parseFloat(pos.split(',')[2]);
  	let y=parseFloat(pos.split(',')[4]);
  	let lat=Math.floor(x/100)+(x%100)/60;
  	let lon=Math.floor(y/100)+(y%100)/60;
  	if(pos.split(',')[3]=='S'){lat=lat*-1;}
		if(pos.split(',')[5]=='W'){lon=lon*-1;}
		
  	document.getElementById('gmap-canvas').src='https://maps.google.com/maps?z=15&t=m&q=loc:'+lat+'+'+lon+'&ie=UTF8&output=embed';
  }
  else{
  	document.getElementById('gmap-canvas').src='https://maps.google.com/maps?q=keep%20tech&t=&z=15&ie=UTF8&iwloc=&output=embed';
  }

});


var counter=0;
var row_name='saved-videos-content-row-'
var latest_row_name='';
database.ref('/alarm_list/' + userId).orderByValue().once('value').then(function(snapshot) {
	var alarm_array=Object.values(snapshot.toJSON());
	console.log(alarm_array);
	alarm_array.forEach(alarm=>{
			var name=alarm.time;

			var alarmRef=firebase.storage().ref(userId+'/'+name+'.mp4');
			
			var newMetadata = {
			      contentDisposition : 'attachment; filename=\"Keep.Car.Alarm.mp4\"',
			      contentType: 'video/mp4'
			    }
		    alarmRef.updateMetadata(newMetadata).then(function(metadata) {
			    	
		
			alarmRef.getDownloadURL().then(function(url){

				if(counter%4==0){
					let row = document.createElement("div");
					row.className='row-table';
					row.id=row_name+String(parseInt(counter/4));
					latest_row_name=row_name+String(parseInt(counter/4));
					document.getElementById('saved-videos-content').appendChild(row);
					var div = document.getElementById(latest_row_name);
					while(div.firstChild){
					    div.removeChild(div.firstChild);
					}//ensure div is empty
				}
			console.log(alarm);
			console.log(latest_row_name);

				var col_div = document.createElement("div");
				col_div.className='col-table';
				var cont_div= document.createElement("div");
				cont_div.className='content-table';
				var cont_img= document.createElement("img");
				firebase.storage().ref(userId+'/thumbnails/'+name+'.PNG').getDownloadURL().then(function(thumbnail){
					cont_img.src=thumbnail;
				}).catch(function(error) {
				  //No thumbnail
				  cont_img.src='/img/default.png';
				});
				cont_img.style='width:100%';
				let date=name.split(' ')[0];
				let time=name.split(' ')[1];

				var cont_p1= document.createElement("p");
				cont_p1.innerHTML='Date: '+date;

				var cont_p2= document.createElement("p");
				cont_p2.innerHTML='Time: '+time;

				var cont_p3= document.createElement("p");
				cont_p3.innerHTML="GPS info: "+alarm.GPS;


				var cont_a= document.createElement("a");
				cont_a.innerHTML="Download";
				cont_a.href=url;
				cont_a.download='Keep_Video';


				cont_div.appendChild(cont_img);
				cont_div.appendChild(cont_p1);
				cont_div.appendChild(cont_p2);
				cont_div.appendChild(cont_p3);
				cont_div.appendChild(cont_a);

				col_div.appendChild(cont_div);

				document.getElementById(latest_row_name).appendChild(col_div);
	


/*	
  <div class="col-table">
    <div class="content-table">
      <img src="/img/example-thumbnail.png" alt="Mountains" style="width:100%">
      <h3>My Work</h3>
      <p>Lorem ipsum dolor sit amet, tempor prodesset eos no. Temporibus necessitatibus sea ei, at tantas oporteat nam. Lorem ipsum dolor sit amet, tempor prodesset eos no.</p>
    </div>
  </div>
*/
			counter=counter+1;
			});//getDownloadURL

		  });//metadata
		});

});




}

     function toggleLogin() {
                 var page = document.getElementById("container-welcome");
                 page.style.display='none';
                 
                 var page2 = document.getElementById("container-login");
                 page2.style.display='block';

		/*		var uiConfig = {
				        // Url to redirect to after a successful sign-in.
				        'signInSuccessUrl': '/error',
				        'callbacks': {
				          'signInSuccess': function(user, credential, redirectUrl) {
				            if (window.opener) {
				              // The widget has been opened in a popup, so close the window
				              // and return false to not redirect the opener.
				              window.close();
				              return false;
				            } else {

								firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);

				                //update(); 
								window.location = (""+window.location).replace(/#[A-Za-z0-9_]*$/,'')+"#dash"
				              return false;
				            }
				          }
				        },
				        'signInOptions': [
				          // TODO(developer): Remove the providers you don't need for your app.
				           {
				            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
				            signInMethod: getEmailSignInMethod()
				          }
				        ],
				        // Terms of service url.
				        'tosUrl': 'https://www.google.com',
				        'credentialHelper': firebaseui.auth.CredentialHelper.NONE
				      };

                  // Initialize the FirebaseUI Widget using Firebase.
			      var ui = new firebaseui.auth.AuthUI(firebase.auth());
			      // The start method will wait until the DOM is loaded to include the FirebaseUI sign-in widget
			      // within the element corresponding to the selector specified.
			      ui.start('#firebaseui-auth-container', uiConfig);
                  */
              }
function signIn(){
	let u=document.getElementById('login-username');
	let p=document.getElementById('login-password');

	firebase.auth().signInWithEmailAndPassword(u.value,p.value).then(function(){
		firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
		
	}).catch(function(error) {
		var code=error.code;
		var msg=error.message;
		var error_email=document.getElementById('error-email');
		error_email.style.display='block';
		error_email.innerHTML=msg;
		console.log(error);
	});



	return false;
}

function update_admin(){
	console.log('Logging in as admin');
	firebase.database().ref('/user_info').once('value', function(snapshot) {
		console.log(snapshot.val());
		user_info_global=snapshot.val();
		var page1 = document.getElementById("container-welcome");
		page1.style.display='block';

		var page2 = document.getElementById("container-login");
		page2.style.display='none';

		var loginbutton = document.getElementById("button-login");
		loginbutton.style.display='none';

		var page3 = document.getElementById("admin-section");
		page3.style.display='block';

		document.getElementById('admin-anchor').scrollIntoView();
	});
}

function lookup(keyword){
	return search(keyword);
}

function searchByName(){
	var result_array=[];
	var search_name=document.getElementById('search-name');
	var i;
	if(search_name!=''){
	var values=Object.values(user_info_global);
	var keys=Object.keys(user_info_global);
	for(i=0;i<values.length;i++){
		var uid=values[i];
		uid['uid']=keys[i];
		if(uid.name && uid.name.toUpperCase().search(search_name.value.toUpperCase())!=-1){
			console.log(uid.name);
			result_array.push(uid);
		}
	}
	console.log(result_array);
	updateList(result_array);
}}

function searchByEmail(){
	var result_array=[];
	var search_name=document.getElementById('search-email');
	var i;
	if(search_name!=''){
	var values=Object.values(user_info_global);
	var keys=Object.keys(user_info_global);
	for(i=0;i<values.length;i++){
		var uid=values[i];uid['uid']=keys[i];
		if(uid.email && uid.email.toUpperCase().search(search_name.value.toUpperCase())!=-1){
			console.log(uid.email);
			result_array.push(uid);
		}
	}
	console.log(result_array);
	updateList(result_array);

	}
}

function searchByPhone(){
	var result_array=[];
	var search_name=document.getElementById('search-phone');
	var i;
	var values=Object.values(user_info_global);
	var keys=Object.keys(user_info_global);
	if(search_name!=''){
	for(i=0;i<values.length;i++){
		var uid=values[i];uid['uid']=keys[i];
		if(uid.phone && uid.phone.search(search_name.value)!=-1){
			console.log(uid.phone);
			result_array.push(uid);
		}
	}
	console.log(result_array);
	updateList(result_array);
}}

function updateList(array){
	console.log(array);
	var parent_div = document.getElementById('admin-list-container');
	
	while(parent_div.firstChild){
	    parent_div.removeChild(parent_div.firstChild);
	}
	var cont_tr= document.createElement("tr");
	var cont_th1= document.createElement("th");
		cont_th1.innerHTML='Name';

	var cont_th2= document.createElement("th");
		cont_th2.innerHTML='Email';

	var cont_th3= document.createElement("th");
		cont_th3.innerHTML='Phone';

	var cont_th4= document.createElement("th");
		cont_th4.innerHTML='Sign in as user';


	cont_tr.appendChild(cont_th1);
	cont_tr.appendChild(cont_th2);
	cont_tr.appendChild(cont_th3);
	cont_tr.appendChild(cont_th4);


	document.getElementById('admin-list-container').appendChild(cont_tr);

	var i=0;
	array.forEach(n=>{

		var cont_td1= document.createElement("td");
		cont_td1.innerHTML=n.name;

		var cont_td2= document.createElement("td");
		cont_td2.innerHTML=n.email;

		var cont_td3= document.createElement("td");
		cont_td3.innerHTML=n.phone;
				
		var cont_a= document.createElement("td");
		cont_a.innerHTML="Sign In";
		cont_a.className='admin-list-click';
		cont_a.onclick=function(a){
			var uid=a.path[0].getAttribute('uid');
			console.log('Signing in as ' +uid);
			update_user(uid);
			document.getElementById('dash').scrollIntoView();
		}
				
		var cont_div= document.createElement("tr");
		cont_div.className='admin-list';
		cont_a.setAttribute('uid',n.uid);
/* <ion-icon name="arrow-forward"></ion-icon>*/
		var arrow_forward=document.createElement('i');
		arrow_forward.className=('fas fa-chevron-right');
		cont_a.appendChild(arrow_forward);


		cont_div.appendChild(cont_td1);
		cont_div.appendChild(cont_td2);
		cont_div.appendChild(cont_td3);

		cont_div.appendChild(cont_a);
		// /cont_div.appendChild(hr);

		document.getElementById('admin-list-container').appendChild(cont_div);
		
		i++;

		});

}
